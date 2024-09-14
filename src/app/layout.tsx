import type { Metadata } from "next";
import { StarknetProvider } from "@/components/starknet-provider";
import "./globals.css";

//const inter = Courier_Prime({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Bootcamp Brasil",
  description: "Frontend Workshop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StarknetProvider>{children}</StarknetProvider>
      </body>
    </html>
  );
}
