'use client';
import { useSearchParams } from "next/navigation";
import Loginform from "@/components/LoginForm";
export default function Login() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorMessage = error === "unauthorized" ? "No estás autorizado para acceder a esta página." : "";

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      {errorMessage && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
          <p>{errorMessage}</p>
        </div>)}
      <Loginform />
      {errorMessage && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
          <p>{errorMessage}</p>
        </div>)}
    </main>
  );
}