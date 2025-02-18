import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  obtenerPuntuacionesExtras,
  guardarPuntuacionesExtras,
} from "../../services/extrasServices";
import { obtenerEquipos } from "../../services/equipoServices";
import { obtenerCategorias } from "../../services/categoriaServices";

const PuntuacionesExtras = () => {
  const [puntuaciones, setPuntuaciones] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertInfo, setAlertInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [categoriasData, equiposData] = await Promise.all([
          obtenerCategorias(),
          obtenerEquipos(),
        ]);

        setCategorias(categoriasData || []);
        setEquipos(equiposData.data || []);

        try {
          const puntuacionesData = await obtenerPuntuacionesExtras();
          const puntuacionesMap = new Map(
            puntuacionesData.map((p) => [p.equipo_id, p])
          );
          const puntuacionesCompletas = equiposData.data.map((equipo) => {
            return (
              puntuacionesMap.get(equipo.id) || {
                equipo_id: equipo.id,
                inauguracion: 0,
                adicional: 0,
              }
            );
          });
          setPuntuaciones(puntuacionesCompletas);
        } catch (puntuacionesError) {
          console.error("Error al cargar puntuaciones:", puntuacionesError);
          const puntuacionesDefault = equiposData.data.map((equipo) => ({
            equipo_id: equipo.id,
            inauguracion: 0,
            adicional: 0,
          }));
          setPuntuaciones(puntuacionesDefault);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        mostrarAlerta(
          "Error al cargar los datos. Por favor, intente nuevamente.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const mostrarAlerta = (mensaje, tipo = "success") => {
    setAlertInfo({ mensaje, tipo });
    setTimeout(() => setAlertInfo(null), 3000);
  };

  const handleChange = (equipo_id, campo, valor) => {
    setPuntuaciones((prev) =>
      prev.map((p) => {
        if (p.equipo_id === equipo_id) {
          return { ...p, [campo]: parseInt(valor) || 0 };
        }
        return p;
      })
    );
  };

  const handleUpdate = async (puntuacion) => {
    try {
      await guardarPuntuacionesExtras({
        equipo_id: puntuacion.equipo_id,
        inauguracion: parseInt(puntuacion.inauguracion) || 0,
        adicional: parseInt(puntuacion.adicional) || 0,
      });

      mostrarAlerta("Puntuaciones actualizadas correctamente");
    } catch (error) {
      console.error("Error actualizando puntuaciones:", error);
      mostrarAlerta(
        "Error al actualizar las puntuaciones. Por favor, intente nuevamente.",
        "error"
      );
    }
  };

  const getCategoriaNombre = (categoriaId) => {
    const categoria = categorias.find((c) => c.id === categoriaId);
    return categoria?.nombre || "N/A";
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" align="left" gutterBottom>
        Puntuaciones Extras
      </Typography>

      {/* Alerta flotante */}
      <Snackbar
        open={!!alertInfo}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={3000}
      >
        <Alert
          severity={alertInfo?.tipo || "success"}
          sx={{
            width: "100%",
            boxShadow: 3,
          }}
        >
          {alertInfo?.mensaje}
        </Alert>
      </Snackbar>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Categoría</TableCell>
              <TableCell>Equipo</TableCell>
              <TableCell align="center">Puntos Inauguración</TableCell>
              <TableCell align="center">Puntos Adicionales</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {equipos.map((equipo) => {
              const puntuacion = puntuaciones.find(
                (p) => p.equipo_id === equipo.id
              ) || {
                inauguracion: 0,
                adicional: 0,
              };

              return (
                <TableRow key={equipo.id}>
                  <TableCell>
                    {getCategoriaNombre(equipo.categoria_id)}
                  </TableCell>
                  <TableCell>{equipo.nombre}</TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={puntuacion.inauguracion}
                      onChange={(e) =>
                        handleChange(equipo.id, "inauguracion", e.target.value)
                      }
                      variant="standard"
                      size="small"
                      inputProps={{ min: 0, style: { textAlign: "center" } }}
                      onFocus={(e) => e.target.select()}
                      autoComplete="off"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={puntuacion.adicional}
                      onChange={(e) =>
                        handleChange(equipo.id, "adicional", e.target.value)
                      }
                      variant="standard"
                      size="small"
                      inputProps={{ min: 0, style: { textAlign: "center" } }}
                      onFocus={(e) => e.target.select()}
                      autoComplete="off"
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() =>
                        handleUpdate({
                          equipo_id: equipo.id,
                          inauguracion: puntuacion.inauguracion,
                          adicional: puntuacion.adicional,
                        })
                      }
                    >
                      Actualizar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PuntuacionesExtras;
