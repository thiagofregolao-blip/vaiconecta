import MercadoPagoConfig, { Payment } from 'mercadopago';

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

const payment = new Payment(mpClient);

interface CreatePixParams {
  planName: string;
  price: number;
  email: string;
  paymentId: string;
}

export async function criarPagamentoPix(params: CreatePixParams) {
  const result = await payment.create({
    body: {
      transaction_amount: params.price,
      description: `VaiConecta - ${params.planName}`,
      payment_method_id: 'pix',
      payer: {
        email: params.email,
      },
      external_reference: params.paymentId,
      notification_url: `${process.env.FRONTEND_URL?.replace('www.', 'api.')}/webhook/mercadopago`,
    },
  });

  return {
    mpPaymentId: String(result.id),
    pixQrCode: result.point_of_interaction?.transaction_data?.qr_code ?? null,
    pixQrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
  };
}

export async function consultarPagamento(mpPaymentId: string) {
  const result = await payment.get({ id: mpPaymentId });
  return result;
}
