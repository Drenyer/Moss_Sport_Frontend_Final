import React, { useState, useEffect, useCallback  } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  TextField,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Alert,
  Snackbar,
} from "@mui/material";
import partidoServices from "../services/partidoServices";
import SubirEvidencia from "./SubirEvidencia";

const PartidosTable = () => {
  // Estados existentes
  const [partidos, setPartidos] = useState([]);
  const [jornadas, setJornadas] = useState([]);
  const [selectedJornada, setSelectedJornada] = useState("");
  const [openEvidenciaDialog, setOpenEvidenciaDialog] = useState(false);
  const [selectedPartido, setSelectedPartido] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Nuevo estado para rastrear partidos actualizados
  const [partidosActualizados, setPartidosActualizados] = useState(new Set());
  const [partidosConEvidencia, setPartidosConEvidencia] = useState(new Set());

  const [equipos, setEquipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);

  const NO_PRESENTADO = "NP";
  const NO_PRESENTADO_VALUE = 9999;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const partidosData = await partidoServices.obtenerPartidos();
        const equiposData = await partidoServices.obtenerEquipos();
        const categoriasData = await partidoServices.obtenerCategorias();
        const disciplinasData = await partidoServices.obtenerDisciplinas();

        const processedPartidos = partidosData.map((partido) => {
          const equipo1 = equiposData.find((e) => e.id === partido.equipo1_id);
          const equipo2 = equiposData.find((e) => e.id === partido.equipo2_id);
          const categoria = categoriasData.find(
            (c) => c.id === partido.categoria_id
          );
          const disciplina = disciplinasData.find(
            (d) => d.id === partido.disciplina_id
          );

          // Si el partido ya está finalizado, agregarlo al Set de partidos actualizados
          if (partido.estado === "finalizado") {
            setPartidosActualizados((prev) => new Set([...prev, partido.id]));
          }

          return {
            ...partido,
            equipo1_nombre: equipo1 ? equipo1.nombre : "Descanso",
            equipo2_nombre: equipo2 ? equipo2.nombre : "Descanso",
            categoria_nombre: categoria ? categoria.nombre : "Desconocida",
            disciplina_nombre: disciplina ? disciplina.nombre : "Desconocida",
            goles_1:
              partido.estado === "descanso" ? "Descanso" : partido.goles_1 || 0,
            goles_2:
              partido.estado === "descanso" ? "Descanso" : partido.goles_2 || 0,
          };
        });

        const jornadasUnicas = [
          ...new Set(processedPartidos.map((p) => p.jornada)),
        ];

        setPartidos(processedPartidos);
        setJornadas(jornadasUnicas);
        setEquipos(equiposData);
        setCategorias(categoriasData);
        setDisciplinas(disciplinasData);

        if (jornadasUnicas.length > 0) {
          setSelectedJornada(jornadasUnicas[0]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const filteredPartidos = partidos.filter(
    (partido) => partido.jornada === selectedJornada
  );

  const mostrarNotificacion = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleScoreChange = (partidoId, field, value) => {
    let newValue = value.trim().toUpperCase(); // Convertimos a mayúsculas y limpiamos espacios

    if (newValue === NO_PRESENTADO) {
      newValue = NO_PRESENTADO_VALUE; // NP se convierte a 9999
    } else if (!isNaN(newValue) && newValue !== "") {
      newValue = Math.max(0, Number(newValue)); // Convertir a número y evitar negativos
    } else {
      return; // Si la entrada es inválida, no hacemos cambios
    }

    setPartidos((prevPartidos) =>
      prevPartidos.map((partido) =>
        partido.id === partidoId
          ? { ...partido, [field]: newValue, estado: "finalizado" }
          : partido
      )
    );
  };

  const handleUpdatePartido = async (partido) => {
    try {
      const goles1 =
        partido.goles_1 === NO_PRESENTADO
          ? NO_PRESENTADO_VALUE
          : Number(partido.goles_1);
      const goles2 =
        partido.goles_2 === NO_PRESENTADO
          ? NO_PRESENTADO_VALUE
          : Number(partido.goles_2);

      const partidoActualizado = {
        ...partido,
        estado: "finalizado",
        goles_1: goles1,
        goles_2: goles2,
      };

      const response = await partidoServices.actualizarPartido(
        partido.id,
        partidoActualizado
      );

      if (response.success) {
        setPartidosActualizados((prev) => new Set([...prev, partido.id]));
        mostrarNotificacion("Partido actualizado exitosamente", "success");

        // **Lógica de puntuación**
        let puntosEquipo1 = 0;
        let puntosEquipo2 = 0;

        if (goles1 === NO_PRESENTADO_VALUE && goles2 === NO_PRESENTADO_VALUE) {
          // Ambos equipos no se presentan → 0 puntos cada uno
          puntosEquipo1 = 0;
          puntosEquipo2 = 0;
        } else if (goles1 === NO_PRESENTADO_VALUE) {
          // Equipo 1 no se presenta → Equipo 2 gana con 3 puntos, equipo 1 0 puntos
          puntosEquipo2 = 3;
          puntosEquipo1 = 0;
        } else if (goles2 === NO_PRESENTADO_VALUE) {
          // Equipo 2 no se presenta → Equipo 1 gana con 3 puntos, equipo 2 0 puntos
          puntosEquipo1 = 3;
          puntosEquipo2 = 0;
        } else {
          // Lógica normal de puntuación
          if (goles1 > goles2) {
            puntosEquipo1 = 3; // Ganador
            puntosEquipo2 = 1; // Perdedor
          } else if (goles2 > goles1) {
            puntosEquipo2 = 3; // Ganador
            puntosEquipo1 = 1; // Perdedor
          } else {
            // Empate → Ambos equipos obtienen 1 punto
            puntosEquipo1 = 2;
            puntosEquipo2 = 2;
          }
        }

        // **Actualizar puntuaciones en la base de datos**
        await Promise.all([
          partidoServices.actualizarPuntuacion(partido.id, {
            equipo_id: partido.equipo1_id,
            disciplina_id: partido.disciplina_id,
            categoria_id: partido.categoria_id,
            torneo_id: partido.torneo_id,
            puntaje_por_equipo: puntosEquipo1,
          }),
          partidoServices.actualizarPuntuacion(partido.id, {
            equipo_id: partido.equipo2_id,
            disciplina_id: partido.disciplina_id,
            categoria_id: partido.categoria_id,
            torneo_id: partido.torneo_id,
            puntaje_por_equipo: puntosEquipo2,
          }),
        ]);
      }
    } catch (error) {
      console.error("Error updating partido:", error);
      mostrarNotificacion("Error al actualizar el partido", "error");
    }
  };

  const formatScoreDisplay = (score) => {
    return score === NO_PRESENTADO_VALUE ? NO_PRESENTADO : score;
  };

  const actualizarPuntuacion = async (
    equipoId,
    disciplinaId,
    categoriaId,
    torneoId,
    puntaje
  ) => {
    try {
      await partidoServices.actualizarPuntuacion({
        equipo_id: equipoId,
        disciplina_id: disciplinaId,
        categoria_id: categoriaId,
        torneo_id: torneoId,
        puntaje_por_equipo: puntaje,
      });
      console.log(
        `Puntuación actualizada: Equipo ${equipoId} -> ${puntaje} puntos`
      );
    } catch (error) {
      console.error("Error al actualizar la puntuación:", error);
    }
  };

  // Función para abrir el diálogo de subir evidencia
  const handleSubirEvidencia = (partido) => {
    setSelectedPartido(partido);
    setOpenEvidenciaDialog(true);
  };

  // Función para cerrar el diálogo de subir evidencia
  const handleCloseEvidenciaDialog = async (evidencia) => {
    if (evidencia && selectedPartido?.id) {
      try {
        await partidoServices.subirEvidencia({
          partido_id: selectedPartido.id,
          url_imagen: evidencia,
          descripcion: "Descripción de la evidencia",
        });
  
        setPartidosConEvidencia((prev) => new Set([...prev, selectedPartido.id]));
        mostrarNotificacion("Evidencia subida exitosamente", "success");
      } catch (error) {
        if (error.message?.includes("ya fue enviada")) {
          console.warn("Evidencia duplicada ignorada");
        } else {
          console.error("❌ Error subiendo evidencia:", error);
          mostrarNotificacion("Error al subir la evidencia", "error");
        }
      }
    }
  
    setOpenEvidenciaDialog(false);
    setSelectedPartido(null);
  };

  return (
    <>
      <Select
        value={selectedJornada}
        onChange={(e) => setSelectedJornada(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      >
        {jornadas.map((jornada) => (
          <MenuItem key={jornada} value={jornada}>
            Jornada {jornada}
          </MenuItem>
        ))}
      </Select>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Disciplina</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Equipo 1</TableCell>
              <TableCell>Equipo 2</TableCell>
              <TableCell>Puntaje 1</TableCell>
              <TableCell>Puntaje 2</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPartidos.map((partido) => (
              <TableRow key={partido.id}>
                <TableCell>{partido.disciplina_nombre}</TableCell>
                <TableCell>{partido.categoria_nombre}</TableCell>
                <TableCell>{partido.equipo1_nombre}</TableCell>
                <TableCell>{partido.equipo2_nombre}</TableCell>
                <TableCell>
                  <TextField
                    value={formatScoreDisplay(partido.goles_1)}
                    onChange={(e) =>
                      handleScoreChange(partido.id, "goles_1", e.target.value)
                    }
                    fullWidth
                    disabled={
                      partido.estado === "descanso" ||
                      partidosActualizados.has(partido.id)
                    }
                    placeholder="0, 1, 2 o NP"
                    helperText="Ingrese 9999 para No Presentado"
                    inputProps={{
                      inputMode: "text", // Permitir números y texto
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={formatScoreDisplay(partido.goles_2)}
                    onChange={(e) =>
                      handleScoreChange(partido.id, "goles_2", e.target.value)
                    }
                    fullWidth
                    disabled={
                      partido.estado === "descanso" ||
                      partidosActualizados.has(partido.id)
                    }
                    placeholder="0, 1, 2 o NP"
                    helperText="Ingrese 9999 para No Presentado"
                    inputProps={{
                      inputMode: "text", // Permitir números y texto
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={partido.estado}
                    color={
                      partido.estado === "finalizado"
                        ? "success"
                        : partido.estado === "descanso"
                        ? "warning"
                        : "primary"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleUpdatePartido(partido)}
                      disabled={
                        partido.estado === "descanso" ||
                        partidosActualizados.has(partido.id)
                      }
                    >
                      Actualizar
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleSubirEvidencia(partido)}
                      disabled={
                        partido.estado === "descanso" ||
                        partidosConEvidencia.has(partido.id)
                      }
                    >
                      Subir Evidencia
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <SubirEvidencia
        open={openEvidenciaDialog}
        onClose={handleCloseEvidenciaDialog}
        partidoId={selectedPartido?.id}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PartidosTable;
