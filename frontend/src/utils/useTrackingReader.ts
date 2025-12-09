// LoginApp/src/utils/useTrackingReader.ts (Nueva Utilidad en la App de Login)

import { useEffect, useState } from 'react';

// 1. Definimos la estructura del dato que esperamos recibir
interface TrackingData {
    sourceApp: string;
    timestamp: string;
    status: string;
}

/**
 * Hook para leer y decodificar el parámetro 'tracking' de la URL.
 * @returns Los datos de rastreo decodificados o null.
 */
export const useTrackingReader = (): TrackingData | null => {
    const [trackingData, setTrackingData] = useState<TrackingData | null>(null);

    useEffect(() => {
        // Obtenemos los parámetros de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const encodedData = urlParams.get('tracking');

        if (encodedData) {
            try {
                // 1. Decodificar (URL -> JSON string)
                const decodedData: string = decodeURIComponent(encodedData);
                
                // 2. Parsear (JSON string -> Objeto TrackingData)
                const data: TrackingData = JSON.parse(decodedData);
                
                setTrackingData(data);
                
                // Opcional: limpiar la URL después de leer el dato
                window.history.replaceState(null, '', window.location.pathname);
                
            } catch (e) {
                console.error("Error al decodificar o parsear datos de tracking:", e);
                setTrackingData(null);
            }
        }
    }, []);

    return trackingData;
};

// Ejemplo de uso en un componente de la App de Login:
/*
const LoginPage: React.FC = () => {
    const trackingInfo = useTrackingReader();

    useEffect(() => {
        if (trackingInfo) {
            console.log("App de origen:", trackingInfo.sourceApp);
            // Aquí puedes decidir qué hacer con el dato de rastreo.
        }
    }, [trackingInfo]);

    // ... renderizado ...
};
*/