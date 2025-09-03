// src/pages/OrderConfirmation.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Order } from '@/types/order';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from 'lucide-react';
import OrderDetails from '@/components/OrderDetails'; // Reutilizando seu componente existente

const OrderConfirmation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const order = location.state?.order as Order;
    const empresaSlug = location.state?.empresaSlug as string;

    if (!order) {
        // Redireciona para a página principal se não houver dados de pedido
        navigate('/');
        return null;
    }

    const handleGoToHome = () => {
        // Redireciona para a página principal com o slug da empresa
        navigate(`/${empresaSlug}`);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Card>
                <CardHeader className="text-center">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <CardTitle className="text-2xl font-bold">Pedido Confirmado!</CardTitle>
                    <p className="text-gray-600">Obrigado pela sua compra. O restaurante já recebeu o seu pedido.</p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="text-center">
                            <p className="text-xl font-semibold">Número do Pedido:</p>
                            <p className="text-gray-700">{order.id?.substring(0, 6)}</p>
                        </div>
                        <h2 className="text-xl font-semibold mt-4 mb-2">Resumo do Pedido</h2>
                        {/* Reutiliza o componente OrderDetails para exibir o resumo */}
                        <OrderDetails order={order} onClose={() => {}} /> 
                        <div className="flex justify-center mt-6">
                            <Button onClick={handleGoToHome} className="w-full sm:w-auto">
                                Fechar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OrderConfirmation;
