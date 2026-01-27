import { jsPDF } from "jspdf";

/**
 * Carga una fuente desde una URL y devuelve su contenido como string Base64
 */
async function loadFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error loading font from ${url}: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();

  // Convertir ArrayBuffer a Base64 manualmente para evitar dependencias
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Carga y registra las fuentes personalizadas en la instancia de jsPDF
 */
export async function loadFonts(doc: jsPDF): Promise<void> {
  try {
    const [fontRegular, fontBold] = await Promise.all([
      loadFontAsBase64("/fonts/Roboto-Regular.ttf"),
      loadFontAsBase64("/fonts/Roboto-Bold.ttf"),
    ]);

    // Registrar Roboto-Regular
    doc.addFileToVFS("Roboto-Regular.ttf", fontRegular);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

    // Registrar Roboto-Bold
    doc.addFileToVFS("Roboto-Bold.ttf", fontBold);
    doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

    console.log("Fuentes cargadas exitosamente");
  } catch (error) {
    console.warn(
      "Error cargando fuentes personalizadas, usando fallback:",
      error,
    );
    // No lanzamos error para permitir que el PDF se genere con fuentes default si falla
  }
}
