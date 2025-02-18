import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import competicionServices from "../../services/competicionServices";
import puntajesService from "../../services/puntajeServices";

const TablaDisciplinas = ({ categoria, disciplina, equipos }) => {
  const [estadisticasEquipos, setEstadisticasEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [puntajesConfig, setPuntajesConfig] = useState([]);
  const [decrementosPorPosicion, setDecrementosPorPosicion] = useState({});

  useEffect(() => {
    const cargarDatos = async () => {
      if (!categoria || !disciplina || !Array.isArray(equipos)) return;

      try {
        setLoading(true);
        console.log("🔄 Cargando datos...");

        // Obtener datos de API
        const [competenciasResponse, resultadosResponse, puntajesData] =
          await Promise.all([
            competicionServices.obtenerCompetenciasIndividuales(),
            competicionServices.obtenerResultadosEquipos(),
            puntajesService.obtenerPuntajes(),
          ]);

        setPuntajesConfig(puntajesData || []);

        // Configurar decrementos basados en los puntajes
        const decrementos = {
          [puntajesData[0]?.puntaje_primer_puesto]: [0, 2, 4, 5, 6, 7, 8, 9],
          [puntajesData[1]?.puntaje_primer_puesto]: [
            0, 4, 8, 10, 12, 14, 16, 18,
          ],
          [puntajesData[2]?.puntaje_primer_puesto]: [
            0, 6, 12, 15, 18, 21, 24, 27,
          ],
          [puntajesData[3]?.puntaje_primer_puesto]: [0, 3, 6, 7, 9, 10, 11, 13],
        };
        setDecrementosPorPosicion(decrementos);

        // Procesamiento de resultados válidos
        let resultados = [];
        if (Array.isArray(resultadosResponse?.data)) {
          resultadosResponse.data.forEach((grupoResultados) => {
            if (Array.isArray(grupoResultados)) {
              resultados.push(
                ...grupoResultados
                  .filter(
                    (res) =>
                      res &&
                      typeof res.competencia_id !== "undefined" &&
                      typeof res.equipo_id !== "undefined" &&
                      typeof res.resultado_equipo === "number"
                  )
                  .map((res) => ({
                    competencia_id: Number(res.competencia_id),
                    equipo_id: Number(res.equipo_id),
                    resultado_equipo: Number(res.resultado_equipo),
                  }))
              );
            }
          });
        }

        // Filtrar competencias por disciplina y categoría
        const competenciasFiltradas = (competenciasResponse?.data || []).filter(
          (comp) => Number(comp.disciplina_id) === Number(disciplina.id)
        );

        // Inicializar estadísticas por equipo
        const estadisticasPorEquipo = new Map();
        equipos.forEach((equipo) => {
          estadisticasPorEquipo.set(equipo.id, {
            id: equipo.id,
            nombre: equipo.nombre,
            CJ: "F",
            PC: 0,
            PTS: 0,
          });
        });

        // Procesar cada competencia
        competenciasFiltradas.forEach((competencia) => {
          const resultadosCompetencia = resultados.filter(
            (r) => r.competencia_id === competencia.id
          );

          if (resultadosCompetencia.length > 0) {
            resultadosCompetencia.forEach((resultado) => {
              const equipo = estadisticasPorEquipo.get(resultado.equipo_id);
              if (equipo) {
                equipo.CJ = "C";
                equipo.PC += resultado.resultado_equipo;
              }
            });
          }
        });

        // Ordenar equipos considerando NP (9999) como el valor más bajo
        const estadisticasOrdenadas = Array.from(
          estadisticasPorEquipo.values()
        ).sort((a, b) => {
          // Si ambos son NP, mantener el orden original
          if (a.PC === 9999 && b.PC === 9999) return 0;
          // Si solo a es NP, ponerlo después
          if (a.PC === 9999) return 1;
          // Si solo b es NP, ponerlo después
          if (b.PC === 9999) return -1;
          // Ordenamiento normal para valores no NP
          return b.PC - a.PC;
        });

        // Asignar puntos según la posición final, excluyendo NP del conteo
        let posicionReal = 0;
        estadisticasOrdenadas.forEach((equipo, index) => {
          if (equipo.PC !== 9999) {
            if (posicionReal < 8) {
              // Solo las primeras 8 posiciones válidas reciben puntos
              const decrementosEquipo =
                decrementos[disciplina.valor_puntos] || [];
              const decremento = decrementosEquipo[posicionReal] || 0;
              const puntosPosicion = Math.max(
                disciplina.valor_puntos - decremento,
                0
              );
              equipo.PTS = puntosPosicion;
            }
            posicionReal++;
          } else {
            equipo.PTS = 0; // Los NP reciben 0 puntos
          }
        });

        setEstadisticasEquipos(estadisticasOrdenadas);
      } catch (error) {
        console.error("❌ Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [categoria, disciplina, equipos]);

  // Función auxiliar para renderizar el valor de PC
  const renderPC = (pc) => {
    return pc === 9999 ? "NP" : pc;
  };

  // Función auxiliar para renderizar la posición
  const renderPosicion = (index, pc) => {
    return pc === 9999 ? "-" : index + 1;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">{disciplina.nombre}</Typography>
        <Typography variant="h5">{categoria.nombre}</Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Posición</TableCell>
              <TableCell>Equipo</TableCell>
              <TableCell align="center">CJ</TableCell>
              <TableCell align="center">PC</TableCell>
              <TableCell align="center">PTS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {estadisticasEquipos.map((equipo, index) => (
              <TableRow key={equipo.id}>
                <TableCell>{renderPosicion(index, equipo.PC)}</TableCell>
                <TableCell>{equipo.nombre}</TableCell>
                <TableCell
                  align="center"
                  sx={{
                    color: equipo.CJ === "F" ? "error.main" : "success.main",
                    fontWeight: "bold",
                  }}
                >
                  {equipo.CJ}
                </TableCell>
                <TableCell align="center">{renderPC(equipo.PC)}</TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: "primary.main" }}
                >
                  {"+" + equipo.PTS}{" "}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default TablaDisciplinas;
