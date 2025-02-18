import React, { useEffect, useState } from 'react';
import { obtenerTorneos } from '../../services/torneoServices';
import { obtenerCategorias } from '../../services/categoriaServices';
import { obtenerDisciplinas } from '../../services/disciplinasServices';
import { obtenerEquipos } from '../../services/equipoServices';
import { obtenerCompetenciasIndividuales, obtenerResultadosEquipos } from '../../services/competicionServices';
import { obtenerPuntuacion } from '../../services/estadisticaServices';
import { obtenerPuntuacionesExtras } from '../../services/extrasServices';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import puntajesService from '../../services/puntajeServices';

const TablaGeneral = () => {
  const [torneos, setTorneos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  const [puntuaciones, setPuntuaciones] = useState([]);
  const [puntuacionesExtras, setPuntuacionesExtras] = useState([]);
  const [decrementosPorPosicion, setDecrementosPorPosicion] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          torneosData,
          categoriasData,
          disciplinasData,
          equiposData,
          resultadosData,
          competenciasData,
          puntuacionesData,
          puntajesConfigData,
          puntuacionesExtrasData
        ] = await Promise.all([
          obtenerTorneos(),
          obtenerCategorias(),
          obtenerDisciplinas(),
          obtenerEquipos(),
          obtenerResultadosEquipos(),
          obtenerCompetenciasIndividuales(),
          obtenerPuntuacion(),
          puntajesService.obtenerPuntajes(),
          obtenerPuntuacionesExtras()
        ]);

        setTorneos(torneosData || []);
        setCategorias(categoriasData || []);
        setDisciplinas(disciplinasData || []);
        setEquipos(equiposData.data || []);
        setResultados(resultadosData.data[0] || []);
        setCompetencias(competenciasData.data || []);
        setPuntuaciones(puntuacionesData || []);
        setPuntuacionesExtras(puntuacionesExtrasData || []);

        const decrementos = {
          [puntajesConfigData[0].puntaje_primer_puesto]: [0, 2, 4, 5, 6, 7, 8, 9],
          [puntajesConfigData[1].puntaje_primer_puesto]: [0, 4, 8, 10, 12, 14, 16, 18],
          [puntajesConfigData[2].puntaje_primer_puesto]: [0, 6, 12, 15, 18, 21, 24, 27],
          [puntajesConfigData[3].puntaje_primer_puesto]: [0, 3, 6, 7, 9, 10, 11, 13]
        };

        setDecrementosPorPosicion(decrementos);
      } catch (error) {
        console.error('Error al obtener datos:', error);
      }
    };

    fetchData();
  }, []);

  const getPuntosExtras = (equipoId, tipo) => {
    const puntuacion = puntuacionesExtras.find(p => p.equipo_id === equipoId);
    if (!puntuacion) return 'F';
    const valor = puntuacion[tipo];
    return valor === 0 ? 'F' : valor;
  };

  const esFutbolOBasquet = (disciplinaId) => {
    const disciplina = disciplinas.find(d => d.id === disciplinaId);
    return disciplina?.tipo === 'colectiva';
  };

  const ESTADOS_PUNTAJE = {
    FALTA: 'F',
    NO_PRESENTADO: 'NP',
    NO_PRESENTADO_VALOR: 9999
  };

  const getPuntajePorDisciplina = (equipoId, disciplinaId) => {
    if (esFutbolOBasquet(disciplinaId)) {
      const puntajesEquipo = puntuaciones.filter(p => 
        p.equipo_id === equipoId && 
        p.disciplina_id === disciplinaId
      );
      
      if (puntajesEquipo.length === 0) return null;
      
      const sumaPuntajes = puntajesEquipo.reduce((sum, p) => sum + (p.puntaje_por_equipo || 0), 0);
      return sumaPuntajes === ESTADOS_PUNTAJE.NO_PRESENTADO_VALOR ? ESTADOS_PUNTAJE.NO_PRESENTADO : sumaPuntajes;
    } else {
      const competencia = competencias.find(c => c.disciplina_id === disciplinaId);
      if (!competencia) return null;

      const resultado = resultados.find(res => 
        res.equipo_id === equipoId && 
        res.competencia_id === competencia.id
      );
      
      if (!resultado) return null;
      if (resultado.resultado_equipo === null) return null;
      return resultado.resultado_equipo === ESTADOS_PUNTAJE.NO_PRESENTADO_VALOR ? 
        ESTADOS_PUNTAJE.NO_PRESENTADO : 
        resultado.resultado_equipo;
    }
  };

  const formatearPuntaje = (puntaje) => {
    if (puntaje === null) return ESTADOS_PUNTAJE.FALTA;
    if (puntaje === ESTADOS_PUNTAJE.NO_PRESENTADO) return ESTADOS_PUNTAJE.NO_PRESENTADO;
    return puntaje;
  };

  const compararPuntajes = (puntajeA, puntajeB) => {
    if (typeof puntajeA === 'number' && typeof puntajeB === 'number') {
      return puntajeB - puntajeA;
    }

    if (typeof puntajeA === 'number') return -1;
    if (typeof puntajeB === 'number') return 1;
    if (puntajeA === ESTADOS_PUNTAJE.NO_PRESENTADO && puntajeB === null) return -1;
    if (puntajeB === ESTADOS_PUNTAJE.NO_PRESENTADO && puntajeA === null) return 1;
    return 0;
  };

  const getPuntajeAdicionalPorPosicion = (valorPuntos, posicion) => {
    const decrementos = decrementosPorPosicion[valorPuntos];
    if (!decrementos || posicion < 1 || posicion > decrementos.length) {
      return 0;
    }
    return valorPuntos - decrementos[posicion - 1];
  };

  const getPuntajePorPosicionEnDisciplina = (equipoId, disciplinaId, categoriaId) => {
    const equiposCategoria = equipos.filter(e => e.categoria_id === categoriaId);
    const disciplina = disciplinas.find(d => d.id === disciplinaId);
    
    if (!disciplina) return ESTADOS_PUNTAJE.FALTA;

    const puntajesEquipos = equiposCategoria
      .map(equipo => ({
        equipoId: equipo.id,
        puntaje: getPuntajePorDisciplina(equipo.id, disciplinaId)
      }))
      .sort((a, b) => compararPuntajes(a.puntaje, b.puntaje));

    const equiposConPuntaje = puntajesEquipos.filter(p => typeof p.puntaje === 'number');
    const posicion = equiposConPuntaje.findIndex(p => p.equipoId === equipoId) + 1;

    const puntajeEquipo = puntajesEquipos.find(p => p.equipoId === equipoId)?.puntaje;

    if (puntajeEquipo === null) return ESTADOS_PUNTAJE.FALTA;
    if (puntajeEquipo === ESTADOS_PUNTAJE.NO_PRESENTADO) return ESTADOS_PUNTAJE.NO_PRESENTADO;
    if (posicion === 0) return ESTADOS_PUNTAJE.FALTA;

    return getPuntajeAdicionalPorPosicion(disciplina.valor_puntos, posicion);
  };

  const getPuntajeTotal = (equipo, categoriaId) => {
    const puntajeBase = disciplinas.reduce((total, disciplina) => {
      const puntaje = getPuntajePorPosicionEnDisciplina(equipo.id, disciplina.id, categoriaId);
      if (typeof puntaje === 'number') {
        return total + puntaje;
      }
      return total;
    }, 0);

    const inauguracion = getPuntosExtras(equipo.id, 'inauguracion');
    const adicional = getPuntosExtras(equipo.id, 'adicional');

    return puntajeBase + 
           (inauguracion === 'F' ? 0 : inauguracion) + 
           (adicional === 'F' ? 0 : adicional);
  };

  const getEquiposOrdenados = (categoriaId) => {
    const equiposCategoria = equipos.filter(equipo => equipo.categoria_id === categoriaId);
    
    return equiposCategoria.sort((a, b) => {
      const puntajeA = getPuntajeTotal(a, categoriaId);
      const puntajeB = getPuntajeTotal(b, categoriaId);
      return puntajeB - puntajeA;
    });
  };

  const getEstiloPuntaje = (puntaje) => {
    if (puntaje === ESTADOS_PUNTAJE.FALTA) {
      return { color: 'gray', fontStyle: 'italic' };
    }
    if (puntaje === ESTADOS_PUNTAJE.NO_PRESENTADO) {
      return { color: 'red' };
    }
    return {};
  };

  const renderTableData = () => {
    if (!categorias.length || !equipos.length || !disciplinas.length) {
      return (
        <TableRow>
          <TableCell colSpan={disciplinas.length + 5}>
            No hay datos disponibles
          </TableCell>
        </TableRow>
      );
    }

    return categorias.map((categoria) => {
      const equiposOrdenados = getEquiposOrdenados(categoria.id);
  
      return (
        <React.Fragment key={categoria.id}>
          <TableRow>
            <TableCell 
              rowSpan={equiposOrdenados.length + 1} 
              style={{ 
                fontWeight: 'bold', 
                backgroundColor: '#f5f5f5',
                verticalAlign: 'top'
              }}
            >
              {categoria.nombre}
            </TableCell>
          </TableRow>
          {equiposOrdenados.map((equipo) => (
            <TableRow key={equipo.id}>
              <TableCell>{equipo.nombre}</TableCell>
              <TableCell align="center" style={getEstiloPuntaje(getPuntosExtras(equipo.id, 'inauguracion'))}>
                {getPuntosExtras(equipo.id, 'inauguracion')}
              </TableCell>
              <TableCell align="center" style={getEstiloPuntaje(getPuntosExtras(equipo.id, 'adicional'))}>
                {getPuntosExtras(equipo.id, 'adicional')}
              </TableCell>
              {disciplinas.map(disciplina => {
                const puntaje = getPuntajePorPosicionEnDisciplina(
                  equipo.id, 
                  disciplina.id, 
                  categoria.id
                );
                return (
                  <TableCell 
                    key={disciplina.id} 
                    align="center"
                    style={getEstiloPuntaje(puntaje)}
                  >
                    {formatearPuntaje(puntaje)}
                  </TableCell>
                );
              })}
              <TableCell style={{ fontWeight: 'bold' }}>
                {getPuntajeTotal(equipo, categoria.id)}
              </TableCell>
            </TableRow>
          ))}
        </React.Fragment>
      );
    });
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Button 
        variant="contained" 
        startIcon={<ArrowBackIcon />} 
        onClick={() => window.history.back()} 
        sx={{ mb: 3 }}
      >
        Retroceder
      </Button>
      
      {torneos.length > 0 && (
        <Typography variant="h4" align="center" gutterBottom>
          {torneos[0].nombre}
        </Typography>
      )}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Categoría</TableCell>
              <TableCell>Equipo</TableCell>
              <TableCell align="center">Inauguración</TableCell>
              <TableCell align="center">Adicional</TableCell>
              {disciplinas.map(disciplina => (
                <TableCell key={disciplina.id} align="center">
                  {disciplina.nombre}
                </TableCell>
              ))}
              <TableCell>Puntaje Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderTableData()}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TablaGeneral;