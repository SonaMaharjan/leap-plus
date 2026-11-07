import GooglePayButtonLib from "@google-pay/button-react";
import { useState } from "react";

type Props = { amountCents: number; onPaid: () => void; onCancel: () => void };

/** Real Google Pay sheet in TEST mode. The payment token is discarded: no real money moves. */
export function GooglePayButton({ amountCents, onPaid, onCancel }: Props) {
  const [ready, setReady] = useState<boolean | null>(null);
  if (ready === false) return null;
  return (
    <div className="relative min-h-[48px]">
      {ready === null && <div className="absolute inset-0 animate-pulse rounded-full bg-neutral-200" />}
      <GooglePayButtonLib
        environment="TEST"
        buttonType="pay"
        buttonColor="black"
        buttonSizeMode="fill"
        style={{ width: "100%", height: 48 }}
        paymentRequest={{
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [
            {
              type: "CARD",
              parameters: { allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"], allowedCardNetworks: ["VISA", "MASTERCARD"] },
              tokenizationSpecification: {
                type: "PAYMENT_GATEWAY",
                parameters: { gateway: "example", gatewayMerchantId: "exampleGatewayMerchantId" },
              },
            },
          ],
          merchantInfo: { merchantId: "12345678901234567890", merchantName: "Leap+ Demo" },
          transactionInfo: {
            totalPriceStatus: "FINAL",
            totalPriceLabel: "Leap+ top-up",
            totalPrice: (amountCents / 100).toFixed(2),
            currencyCode: "EUR",
            countryCode: "IE",
          },
        }}
        onReadyToPayChange={(r) => setReady(r.isReadyToPay)}
        onLoadPaymentData={() => onPaid()}
        onCancel={() => onCancel()}
        onError={() => onCancel()}
      />
    </div>
  );
}
