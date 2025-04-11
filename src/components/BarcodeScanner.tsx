import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface BarcodeScannerProps {
  onScan: (barcode: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  disabled = false,
  placeholder = "Digite ou escaneie o código de barras",
  className = ""
}) => {
  const [barcode, setBarcode] = useState('');
  const { toast } = useToast();

  const handleBarcodeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      await handleBarcodeSubmit();
    }
  };

  const handleBarcodeBlur = async () => {
    if (barcode.trim()) {
      await handleBarcodeSubmit();
    }
  };

  const handleBarcodeSubmit = async () => {
    if (!barcode.trim() || disabled) return;

    try {
      await onScan(barcode);
      setBarcode('');
    } catch (error) {
      // O toast de erro já é mostrado no hook
    }
  };

  return (
    <Input
      type="text"
      value={barcode}
      onChange={(e) => setBarcode(e.target.value)}
      onKeyDown={handleBarcodeKeyDown}
      onBlur={handleBarcodeBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}; 