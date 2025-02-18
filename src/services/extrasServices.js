import axios from "axios";

const API_URL = "http://localhost:5000/api/extras";

export const obtenerPuntuacionesExtras = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo puntuaciones extras", error);
    throw error;
  }
};

export const guardarPuntuacionesExtras = async (puntuaciones) => {
  try {
    await axios.put(`${API_URL}/${puntuaciones.equipo_id}`, puntuaciones);
    return { success: true };
  } catch (error) {
    console.error("Error actualizando puntuaciones extras", error);
    throw error;
  }
};
