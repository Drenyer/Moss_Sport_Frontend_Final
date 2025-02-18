import { useEffect, useState } from 'react';
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
  CircularProgress 
} from '@mui/material';
import { obtenerEstadisticasEquipo } from '../../services/estadisticaServices';
import partidosServices from '../../services/partidoServices';
import puntajesService from '../../services/puntajeServices';

const TablaBaloncesto = ({ categoria, disciplina, equipos }) => {
  const [estadisticasEquipos, setEstadisticasEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [puntajesConfig, setPuntajesConfig] = useState([]);
  const [decrementosPorPosicion, setDecrementosPorPosicion] = useState({});

  useEffect(() => {
    const obtenerEstadisticasYPuntos = async () => {
      if (!categoria || !disciplina || !Array.isArray(equipos)) return;

      try {
        setLoading(true);
        
        // Obtener configuración de puntajes y partidos
        const [partidos, puntajesData] = await Promise.all([
          partidosServices.obtenerPartidos(),
          puntajesService.obtenerPuntajes()
        ]);

        setPuntajesConfig(puntajesData || []);
        
        // Configurar decrementos basados en los puntajes
        const decrementos = {
          [puntajesData[0]?.puntaje_primer_puesto]: [0, 2, 4, 5, 6, 7, 8, 9],
          [puntajesData[1]?.puntaje_primer_puesto]: [0, 4, 8, 10, 12, 14, 16, 18],
          [puntajesData[2]?.puntaje_primer_puesto]: [0, 6, 12, 15, 18, 21, 24, 27],
          [puntajesData[3]?.puntaje_primer_puesto]: [0, 3, 6, 7, 9, 10, 11, 13]
        };
        setDecrementosPorPosicion(decrementos);

        // Obtener torneoId del primer partido
        const torneoId = partidos.length > 0 ? partidos[0].torneo_id : null;

        if (!torneoId) {
          console.error("No se pudo determinar el torneo_id");
          setLoading(false);
          return;
        }

        // Obtener estadísticas para cada equipo con el torneoId dinámico
        const estadisticasEquipos = await Promise.all(
          equipos.map(equipo => 
            obtenerEstadisticasEquipo(
              equipo.id,
              disciplina.id,
              categoria.id,
              torneoId
            )
          )
        );

        console.log(estadisticasEquipos);

        const partidosRelevantes = partidos.filter(partido => 
          partido.disciplina_id === disciplina.id &&
          partido.categoria_id === categoria.id &&
          partido.estado === 'finalizado'
        );

        const estadisticasCompletas = equipos.map((equipo, index) => {
          const estadisticas = estadisticasEquipos[index];
          
          const puntosData = partidosRelevantes.reduce((acc, partido) => {
            if (partido.equipo1_id === equipo.id) {
              if (partido.goles_1 !== 9999 && partido.goles_2 !== 9999) {
                acc.puntosFavor += partido.goles_1 || 0;
                acc.puntosContra += partido.goles_2 || 0;
              }
            } else if (partido.equipo2_id === equipo.id) {
              if (partido.goles_1 !== 9999 && partido.goles_2 !== 9999) {
                acc.puntosFavor += partido.goles_2 || 0;
                acc.puntosContra += partido.goles_1 || 0;
              }
            }
            return acc;
          }, { puntosFavor: 0, puntosContra: 0 });

          return {
            ...equipo,
            PG: estadisticas.partidosGanados || 0,
            PP: estadisticas.partidosPerdidos || 0,
            PJ: (estadisticas.partidosGanados || 0) + 
                (estadisticas.partidosPerdidos || 0),
            PTS: estadisticas.puntaje_por_equipo || 0,
            PF: puntosData.puntosFavor,
            PC: puntosData.puntosContra,
            DP: puntosData.puntosFavor - puntosData.puntosContra
          };
        });

        const estadisticasOrdenadas = estadisticasCompletas.sort((a, b) => {
          if (b.PTS !== a.PTS) return b.PTS - a.PTS;
          if (b.DP !== a.DP) return b.DP - a.DP;
          if (b.PF !== a.PF) return b.PF - a.PF;
          if (b.PG !== a.PG) return b.PG - a.PG;
          return a.nombre.localeCompare(b.nombre);
        });

        // Aplicar decrementos según posición
        const estadisticasConDecrementos = estadisticasOrdenadas.map((equipo, index) => {
          if (index < 8) {
            const decrementosEquipo = decrementos[disciplina.valor_puntos] || [];
            const decremento = decrementosEquipo[index] || 0;
            const puntosPosicion = Math.max(disciplina.valor_puntos - decremento, 0);
            return {
              ...equipo,
              puntosPorPosicion: puntosPosicion,
              decremento: decremento
            };
          }
          return {
            ...equipo,
            puntosPorPosicion: 0,
            decremento: 0
          };
        });

        setEstadisticasEquipos(estadisticasConDecrementos);
      } catch (error) {
        console.error('Error al obtener datos:', error);
      } finally {
        setLoading(false);
      }
    };

    obtenerEstadisticasYPuntos();
  }, [categoria, disciplina, equipos]);

  // El resto del componente permanece igual
  if (!categoria || !disciplina || !Array.isArray(equipos)) {
    return (
      <Container maxWidth="xl">
        <Typography variant="h6" color="error" align="center">
          Error: Datos incompletos o inválidos
        </Typography>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">{disciplina.nombre}</Typography>
        <Typography variant="h5">{categoria.nombre}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Total de equipos: {equipos.length}
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Pos</TableCell>
              <TableCell>Equipo</TableCell>
              <TableCell align="center">PJ</TableCell>
              <TableCell align="center">PG</TableCell>
              <TableCell align="center">PP</TableCell>
              <TableCell align="center">PF</TableCell>
              <TableCell align="center">PC</TableCell>
              <TableCell align="center">DP</TableCell>
              <TableCell align="center">PTS</TableCell>
              <TableCell align="center">PA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {estadisticasEquipos.length > 0 ? (
              estadisticasEquipos.map((equipo, index) => (
                <TableRow 
                  key={equipo.id}
                  sx={{
                    backgroundColor: index < 3 ? '#f5f5f5' : '',
                    '&:hover': { backgroundColor: '#fafafa' }
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{equipo.nombre}</TableCell>
                  <TableCell align="center">{equipo.PJ}</TableCell>
                  <TableCell align="center">{equipo.PG}</TableCell>
                  <TableCell align="center">{equipo.PP}</TableCell>
                  <TableCell align="center">{equipo.PF}</TableCell>
                  <TableCell align="center">{equipo.PC}</TableCell>
                  <TableCell align="center" 
                    sx={{ 
                      color: equipo.DP > 0 ? 'green' : equipo.DP < 0 ? 'red' : 'inherit'
                    }}
                  >
                    {equipo.DP > 0 ? `+${equipo.DP}` : equipo.DP}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    {equipo.PTS}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    +{equipo.puntosPorPosicion}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No hay equipos disponibles.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default TablaBaloncesto;