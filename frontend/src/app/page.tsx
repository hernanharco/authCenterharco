// frontend/src/app/page.js
// Next.js App Router renderiza la ruta raíz (/)
import AuthForm from '@/components/AuthForm';

// Hacemos que la página sea un cliente para usar el componente AuthForm
// Si tu archivo es JSX, añade 'use client' al inicio si usas App Router.
export default function HomePage() {
    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
            <h1>Autenticación Segura</h1>
            <AuthForm />
        </div>
    );
}