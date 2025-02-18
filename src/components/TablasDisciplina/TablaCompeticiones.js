import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
} from "@mui/material";
import {
  obtenerCategoriasPorDisciplina,
  obtenerResultadosEquipos,
} from "../../services/competicionServices";
import { obtenerEquipos } from "../../services/equipoServices";

const TablaCompeticiones = ({ competencias, onActualizarResultado }) => {
  // Estados de filtrado
  const [disciplinaFiltrada, setDisciplinaFiltrada] = useState("");
  const [categoriaFiltrada, setCategoriaFiltrada] = useState("");

  // Estados de datos
  const [equiposCompetencia, setEquiposCompetencia] = useState([]);
  const [disciplinasUnicas, setDisciplinasUnicas] = useState([]);
  const [categoriasPorDisciplina, setCategoriasPorDisciplina] = useState([]);
  const [resultadosActualizados, setResultadosActualizados] = useState(
    new Set()
  );
  const [todosLosEquipos, setTodosLosEquipos] = useState([]);

  // Estados de UI
  const [cargandoEquipos, setCargandoEquipos] = useState(false);
  const [errorEquipos, setErrorEquipos] = useState(null);

  const NO_PRESENTADO = "NP";
  const NO_PRESENTADO_VALUE = 9999;

  // Carga inicial de datos
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      if (!competencias?.data) return;

      try {
        setCargandoEquipos(true);
        const competenciasData = competencias.data;

        // 1. Procesar disciplinas únicas
        const disciplinasSet = new Set();
        const disciplinas = competenciasData
          .map((comp) => ({
            id: comp.disciplina_id,
            nombre: comp.disciplina_nombre,
          }))
          .filter((disc) => {
            if (!disciplinasSet.has(disc.id)) {
              disciplinasSet.add(disc.id);
              return true;
            }
            return false;
          });

        setDisciplinasUnicas(disciplinas);

        // 2. Obtener todos los equipos de una vez
        const equiposResponse = await obtenerEquipos();
        const equiposData = equiposResponse?.data || [];
        setTodosLosEquipos(equiposData);

        // 3. Obtener resultados
        const resultadosResponse = await obtenerResultadosEquipos();
        const resultadosData = Array.isArray(resultadosResponse?.data?.[0])
          ? resultadosResponse.data[0]
          : resultadosResponse?.data || [];

        // 4. Combinar información
        const equiposFormateados = resultadosData
          .filter((resultado) => resultado && resultado.equipo_id)
          .map((resultado) => {
            const competencia = competenciasData.find(
              (comp) => comp.id === resultado.competencia_id
            );

            const equipoInfo = equiposData.find(
              (equipo) => equipo.id === resultado.equipo_id
            );

            if (!competencia || !equipoInfo) return null;

            return {
              uniqueKey: `equipo-${resultado.equipo_id}-${resultado.competencia_id}`,
              id: resultado.equipo_id,
              nombre: equipoInfo.nombre,
              capitan: equipoInfo.capitan_nombre,
              categoria_id: equipoInfo.categoria_id,
              competencia_id: resultado.competencia_id,
              disciplina_id: competencia.disciplina_id,
              resultado: resultado.resultado_equipo || null,
              tieneResultado: resultado.resultado_equipo != null,
            };
          })
          .filter(Boolean);

        setEquiposCompetencia(equiposFormateados);
      } catch (error) {
        console.error("Error en carga inicial:", error);
        setErrorEquipos(
          "Error al cargar los datos. Por favor, intente nuevamente."
        );
      } finally {
        setCargandoEquipos(false);
      }
    };

    cargarDatosIniciales();
  }, [competencias]);

  // Cargar categorías al cambiar disciplina
  useEffect(() => {
    const cargarCategorias = async () => {
      if (!disciplinaFiltrada) {
        setCategoriasPorDisciplina([]);
        setCategoriaFiltrada("");
        return;
      }

      try {
        const response = await obtenerCategoriasPorDisciplina(
          disciplinaFiltrada
        );
        if (response?.data) {
          setCategoriasPorDisciplina(response.data);
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        setErrorEquipos("Error al cargar las categorías");
      }
    };

    cargarCategorias();
  }, [disciplinaFiltrada]);

  // Filtrado de equipos usando useMemo
  const equiposFiltrados = useMemo(() => {
    let equipos = [...equiposCompetencia];

    if (disciplinaFiltrada) {
      equipos = equipos.filter(
        (equipo) => equipo.disciplina_id === parseInt(disciplinaFiltrada, 10)
      );
    }

    if (categoriaFiltrada) {
      equipos = equipos.filter(
        (equipo) => equipo.categoria_id === parseInt(categoriaFiltrada, 10)
      );
    }

    return equipos;
  }, [equiposCompetencia, disciplinaFiltrada, categoriaFiltrada]);

  // Handlers
  const handleDisciplinaChange = (event) => {
    const nuevaDisciplinaId = event.target.value;
    setDisciplinaFiltrada(nuevaDisciplinaId);
    setCategoriaFiltrada(""); // Reset categoría al cambiar disciplina
  };

  const handleCategoriaChange = (event) => {
    setCategoriaFiltrada(event.target.value);
  };

  const formatearValorMostrado = (valor) => {
    return valor === NO_PRESENTADO_VALUE ? NO_PRESENTADO : valor;
  };

  const handleResultadoChange = (uniqueKey, nuevoValor) => {
    let valorProcesado = nuevoValor.trim().toUpperCase();

    if (valorProcesado === NO_PRESENTADO) {
      valorProcesado = NO_PRESENTADO_VALUE;
    } else if (!isNaN(valorProcesado) && valorProcesado !== "") {
      valorProcesado = Number(valorProcesado);
    } else {
      return;
    }

    setEquiposCompetencia((prevEquipos) =>
      prevEquipos.map((eq) =>
        eq.uniqueKey === uniqueKey ? { ...eq, resultado: valorProcesado } : eq
      )
    );
  };

  const handleActualizarResultado = (uniqueKey) => {
    const equipo = equiposFiltrados.find((eq) => eq.uniqueKey === uniqueKey);

    if (!equipo) return;

    onActualizarResultado(equipo.competencia_id, equipo.id, equipo.resultado);
    
    setResultadosActualizados((prev) => new Set([...prev, uniqueKey]));
  };

  return (
    <Box>
      {/* Filtros */}
      <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
          <InputLabel>Disciplina</InputLabel>
          <Select
            value={disciplinaFiltrada}
            onChange={handleDisciplinaChange}
            label="Disciplina"
          >
            <MenuItem value="">
              <em>Todas</em>
            </MenuItem>
            {disciplinasUnicas.map((disciplina) => (
              <MenuItem key={disciplina.id} value={disciplina.id.toString()}>
                {disciplina.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
          <InputLabel>Categoría</InputLabel>
          <Select
            value={categoriaFiltrada}
            onChange={handleCategoriaChange}
            label="Categoría"
            disabled={!disciplinaFiltrada}
          >
            <MenuItem value="">
              <em>Todas</em>
            </MenuItem>
            {categoriasPorDisciplina.map((categoria) => (
              <MenuItem key={categoria.id} value={categoria.id.toString()}>
                {categoria.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Tabla de equipos */}
      {!cargandoEquipos && !errorEquipos && equiposFiltrados.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Equipo</TableCell>
              <TableCell>Capitán</TableCell>
              <TableCell>Disciplina</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Puntaje Individual</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {equiposFiltrados.map((equipo) => (
              <TableRow key={equipo.uniqueKey}>
                <TableCell>{equipo.nombre}</TableCell>
                <TableCell>{equipo.capitan}</TableCell>
                <TableCell>
                  {disciplinasUnicas.find(d => d.id === equipo.disciplina_id)?.nombre || 'Sin disciplina'}
                </TableCell>
                <TableCell>
                  {categoriasPorDisciplina.length > 0 
                    ? (categoriasPorDisciplina.find(cat => cat.id === equipo.categoria_id)?.nombre 
                       || todosLosEquipos.find(e => e.id === equipo.id)?.categoria_nombre 
                       || 'Sin categoría')
                    : (todosLosEquipos.find(e => e.id === equipo.id)?.categoria_nombre 
                       || 'Sin categoría')}
                </TableCell>
                <TableCell>
                  <TextField
                    value={formatearValorMostrado(equipo.resultado)}
                    onChange={(e) =>
                      handleResultadoChange(equipo.uniqueKey, e.target.value)
                    }
                    placeholder="Puntaje o NP"
                    helperText="Ingrese 9999 para No Presentado"
                    inputProps={{
                      inputMode: "text",
                    }}
                    sx={{ minWidth: "120px" }}
                  />
                </TableCell>
                <TableCell>
                  {/* Estado actualizado basado en resultadosActualizados */}
                  {resultadosActualizados.has(equipo.uniqueKey) || equipo.tieneResultado
                    ? "Finalizado"
                    : "Pendiente"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    onClick={() => handleActualizarResultado(equipo.uniqueKey)}
                  >
                    Actualizar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        !cargandoEquipos && !errorEquipos && (
          <Typography variant="body2" color="textSecondary">
            No se encontraron equipos.
          </Typography>
        )
      )}
    </Box>
  );
};

export default TablaCompeticiones;
