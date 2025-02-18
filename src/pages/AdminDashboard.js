// pages/AdminDashboard.js

import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import axios from "axios";
import CrearTorneoModal from "../components/CrearTorneoModal";
import EditarTorneoModal from "../components/EditarTorneoModal";
import EliminarTorneoModal from "../components/EliminarTorneoModal";
import DetallesTorneoModal from "../components/DetallesTorneoModal";
import TablaPosiciones from "../components/TablaPosiciones"; 
import EquipoTable from "../components/EquipoTable";
import AgregarJugadorDialog from "../components/AgregarJugadorDialog";
import JugadoresDialog from "../components/JugadoresDialog";
import AgregarEquipoDialog from "../components/AgregarEquipoDialog";
import RegisterPage from "./RegisterPage";
import TorneosDisciplinasCategorias from "../components/TorneosDisciplinasCategorias";
import LogoAuth from "../components/logoAuth";
import Partidos from "../components/Partidos";
import PartidoIndividual from "../components/AdminDashboard/PartidosIndividuales";
import PuntajeDisciplinas from "../components/TablasDisciplina/PuntajeDisciplinas";
import PartidosExtras from "../components/AdminDashboard/PuntuacionesExtras";

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("Estadísticas");
  const [stats, setStats] = useState(null);
  const [torneos, setTorneos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedTorneoId, setSelectedTorneoId] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [torneoToDelete, setTorneoToDelete] = useState(null);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [torneoToView, setTorneoToView] = useState(null);
  const [posiciones, setPosiciones] = useState([]);
  const [selectedTorneo, setSelectedTorneo] = useState(null);
  const [showPosiciones, setShowPosiciones] = useState(false);
  const [modalUpdateOpen, setModalUpdateOpen] = useState(false);
  const [partidoActual, setPartidoActual] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalFinalizarOpen, setModalFinalizarOpen] = useState(false);
  const [editPartido, setEditPartido] = useState(null);
  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [jugadorNombre, setJugadorNombre] = useState("");
  const [jugadorEdad, setJugadorEdad] = useState("");
  const [jugadorPosicion, setJugadorPosicion] = useState("");
  const [jugadorNumeroCamiseta, setJugadorNumeroCamiseta] = useState("");
  const [jugadores, setJugadores] = useState([]);
  const [userName, setUserName] = useState("");
  const [openDialogEquipo, setOpenDialogEquipo] = useState(false);
  const [nuevoEquipo, setNuevoEquipo] = useState({
    nombre: "",
    email_capitan: "",
    nombre_torneo: "",
  });
  const [openJugadoresDialog, setOpenJugadoresDialog] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);

  useEffect(() => {

    const fetchData = async () => {
      try {
        const statsResponse = await axios.get(
          "http://localhost:5000/api/torneos/estadisticas"
        );
        const torneosResponse = await axios.get(
          "http://localhost:5000/api/torneos"
        );
        const equiposResponse = await axios.get(
          "http://localhost:5000/api/equipos"
        );
        const partidosResponse = await axios.get(
          "http://localhost:5000/api/partidos"
        );
  

        setStats(statsResponse.data);
        setTorneos(torneosResponse.data);
        setPartidos(partidosResponse.data);
        
      } catch (error) {
        console.error("Error al obtener datos:", error);
      }
    };

    fetchData();
  }, []);

  const equiposFiltrados = equipos.filter(
    (equipo) => equipo.nombre_capitan === userName
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      setUserName(decodedToken.nombre);
    }
  }, []);

  const onAgregarJugador = (equipo) => {
    // Aquí va la lógica para agregar un jugador al equipo
  };

  const onVerJugadores = (equipoId) => {
    // Aquí va la lógica para ver los jugadores del equipo
  };

  const eliminarEquipo = async (equipoId) => {
    try {
      await axios.delete(`http://localhost:5000/api/equipos/${equipoId}`);
      setEquipos(equipos.filter((equipo) => equipo.id !== equipoId));
    } catch (error) {
      console.error("Error al eliminar el equipo:", error);
    }
  };

  const getEquipoNombre = (id) => {
    const equipo = equipos.find((equipo) => equipo.equipo_id === id);
    return equipo ? equipo.nombre_equipo : "Desconocido";
  };

  const handleAgregarJugador = (equipo) => {
    setEquipoSeleccionado(equipo);
    setOpenJugadoresDialog(true);
  };

  const handleCloseJugadoresDialog = () => {
    setOpenJugadoresDialog(false);
    setEquipoSeleccionado(null);
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const handleOpenEditModal = (torneoId) => {
    setSelectedTorneoId(torneoId);
    setOpenEditModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setSelectedTorneoId(null);
  };

  const handleUpdateTorneo = (updatedTorneo) => {
    setTorneos((prevTorneos) =>
      prevTorneos.map((torneo) =>
        torneo.id === updatedTorneo.id ? updatedTorneo : torneo
      )
    );
  };

  const handleOpenDeleteModal = (torneoId) => {
    setTorneoToDelete(torneoId);
    setOpenDeleteModal(true);
  };

  const handleDeleteTorneo = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/torneos/${torneoToDelete}`);
      setTorneos(torneos.filter((torneo) => torneo.id !== torneoToDelete));
      setOpenDeleteModal(false);
      setTorneoToDelete(null);
    } catch (error) {
      console.error("Error al eliminar el torneo:", error);
    }
  };

  const handleOpenDetailsModal = (torneoId) => {
    setTorneoToView(torneoId);
    setOpenDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setOpenDetailsModal(false);
    setTorneoToView(null);
  };

  const fetchPosiciones = async (idTorneo) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/torneos/${idTorneo}/posiciones`
      );
      setPosiciones(response.data);
    } catch (error) {
      console.error("Error al obtener posiciones:", error);
    }
  };

  const handleTorneoSelect = (torneo) => {
    setSelectedTorneo(torneo);
    setShowPosiciones(false);
    fetchPosiciones(torneo.id);
  };

  const togglePosiciones = () => {
    setShowPosiciones(!showPosiciones);
  };

  const handleAbrirFormulario = (equipo) => {
    setEquipoSeleccionado(equipo);
    setOpenDialog(true);
  };

  const handleCerrarFormulario = () => {
    setOpenDialog(false);
    setJugadorNombre("");
    setJugadorEdad("");
    setJugadorPosicion("");
    setJugadorNumeroCamiseta("");
  };

  const handleVerJugadores = async (equipoId) => {
    try {
      const response = await axios.get("http://localhost:5000/api/jugadores");
      const jugadoresEquipo = response.data.filter(
        (jugador) => jugador.equipo_id === equipoId
      );
      setJugadores(jugadoresEquipo);
      setEquipoSeleccionado(
        equipos.find((equipo) => equipo.equipo_id === equipoId)
      );
    } catch (error) {
      console.error("Error al obtener los jugadores:", error);
    }
  };

  const handleActualizarJugador = (jugadorActualizado) => {
    setJugadores((prevJugadores) =>
      prevJugadores.map((jugador) =>
        jugador.id === jugadorActualizado.id ? jugadorActualizado : jugador
      )
    );
  };

  const handleEliminarJugador = (jugadorId) => {
    setJugadores(jugadores.filter((jugador) => jugador.id !== jugadorId));
  };

  const handleAbrirFormularioEquipo = () => {
    setOpenDialogEquipo(true);
  };

  const handleCerrarFormularioEquipo = () => {
    setOpenDialogEquipo(false);
    setNuevoEquipo({
      nombre: "",
      email_capitan: "",
      nombre_torneo: "",
    });
  };

  const handleAgregarEquipo = async () => {
    if (
      !nuevoEquipo.nombre ||
      !nuevoEquipo.email_capitan ||
      !nuevoEquipo.nombre_torneo
    ) {
      alert("Por favor complete todos los campos.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/equipos", nuevoEquipo);
      handleCerrarFormularioEquipo();
      const equiposResponse = await axios.get(
        "http://localhost:5000/api/equipos"
      );
      setEquipos(equiposResponse.data);
    } catch (error) {
      console.error("Error al agregar equipo:", error);
    }
  };  


  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* Menú lateral */}
      <Box
        sx={{
          width: "250px",
          backgroundColor: "#f5f5f5",
          borderRight: "1px solid #ddd",
          padding: "20px",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Admin Dashboard
        </Typography>
        <List>
          <ListItem
            button
            onClick={() => handleSectionChange("TorneosDisciplinasCategorias")}
          >
            <ListItemText primary="Torneos, Disciplinas y Categorías" />
          </ListItem>
          <Divider />
          <ListItem button onClick={() => handleSectionChange("Equipos")}>
            <ListItemText primary="Equipos" />
          </ListItem>
          <Divider />
          <ListItem button onClick={() => handleSectionChange("Partidos-colectivos")}>
            <ListItemText primary="Partidos Colectivos" />
          </ListItem>
          <Divider />
          <ListItem button onClick={() => handleSectionChange("Partidos-individuales")}>
            <ListItemText primary="Partidos Individuales" />
          </ListItem>
          <Divider />
          <ListItem button onClick={() => handleSectionChange("Partidos-extras")}>
            <ListItemText primary="Inaguración" />
          </ListItem>
          <Divider />
          <ListItem button onClick={() => handleSectionChange("Puntaje-Disciplina")}>
            <ListItemText primary="Puntaje Disciplina" />
          </ListItem>
          <Divider />
          <ListItem
            button
            onClick={() => handleSectionChange("RegistrarUsuarios")}
          >
            <ListItemText primary="Registrar Usuarios" />
            
          </ListItem>
          
            <LogoAuth />
    
        </List>
      </Box>

      {/* Contenido principal */}
      <Box sx={{ flex: 1, padding: "20px" }}>
        
        {activeSection === "TorneosDisciplinasCategorias" && (
          <Box>
            <TorneosDisciplinasCategorias />
          </Box>
        )}

        {activeSection === "Equipos" && (
          <Box>
            <EquipoTable onAgregarJugador={handleAgregarJugador} />
            <JugadoresDialog
              open={openJugadoresDialog}
              onClose={handleCloseJugadoresDialog}
              equipoId={equipoSeleccionado ? equipoSeleccionado.id : null}
            />
          </Box>
        )}

        {activeSection === "Partidos-colectivos" && (
          <Box>
            <Partidos />
          </Box>  
        )}

        {activeSection === "Partidos-individuales" && (
          <Box>
            <PartidoIndividual />
          </Box>  
        )}

        {activeSection === "Partidos-extras" && (
          <Box>
            <PartidosExtras />
          </Box>  
        )}

        {activeSection === "Puntaje-Disciplina" && (
          <Box>
            <PuntajeDisciplinas/>
          </Box>  
        )}

        {activeSection === "RegistrarUsuarios" && <RegisterPage />}
      </Box>

      <AgregarJugadorDialog
        open={openDialog}
        onClose={handleCerrarFormulario}
        equipoSeleccionado={equipoSeleccionado}
        jugadorNombre={jugadorNombre}
        jugadorEdad={jugadorEdad}
        jugadorPosicion={jugadorPosicion}
        jugadorNumeroCamiseta={jugadorNumeroCamiseta}
        setJugadorNombre={setJugadorNombre}
        setJugadorEdad={setJugadorEdad}
        setJugadorPosicion={setJugadorPosicion}
        setJugadorNumeroCamiseta={setJugadorNumeroCamiseta}
        onAgregarJugador={handleAgregarJugador}
      />

      <JugadoresDialog
        jugadores={jugadores}
        equipoSeleccionado={equipoSeleccionado}
        onClose={() => setJugadores([])}
        onEliminarJugador={handleEliminarJugador}
        onActualizarJugador={handleActualizarJugador}
      />

      <AgregarEquipoDialog
        open={openDialogEquipo}
        onClose={handleCerrarFormularioEquipo}
        onAgregarEquipo={handleAgregarEquipo}
        nuevoEquipo={nuevoEquipo}
        setNuevoEquipo={setNuevoEquipo}
      />

      {openCreateModal && (
        <CrearTorneoModal
          open={openCreateModal}
          onClose={() => setOpenCreateModal(false)}
        />
      )}

      {openEditModal && (
        <EditarTorneoModal
          open={openEditModal}
          onClose={handleCloseEditModal}
          torneoId={selectedTorneoId}
          onUpdate={handleUpdateTorneo}
        />
      )}

      {openDeleteModal && (
        <EliminarTorneoModal
          open={openDeleteModal}
          onClose={() => setOpenDeleteModal(false)}
          torneoToDelete={torneoToDelete}
          onDelete={handleDeleteTorneo}
        />
      )}

      {openDetailsModal && (
        <DetallesTorneoModal
          open={openDetailsModal}
          onClose={handleCloseDetailsModal}
          torneoId={torneoToView}
        />
      )}
    </Box>
  );
};
export default AdminDashboard;
