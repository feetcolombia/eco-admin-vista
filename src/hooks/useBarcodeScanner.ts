import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";

interface BarcodeScannerOptions {
  soundEnabled?: boolean;
  onScan?: (barcode: string) => void;
}

export const useBarcodeScanner = (options: BarcodeScannerOptions = {}) => {
  const { soundEnabled = false, onScan } = options;
  const { toast } = useToast();
  const [totalScanned, setTotalScanned] = useState(0);

  const playScanSound = () => {
    if (soundEnabled) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSl+zPLaizsIGGS57OihUBELTKXh8bllHgU2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z1YU2Bhxqvu7mnEoODlOq5O+zYBoGPJPY88p2KwUme8rx3I4+CRZiturqpVITC0mi4PK8aB8GM4nU8tGAMQYfcsLu45ZFDBFYr+fur1wYB0CX2/PEcycFKn/M8tiKOggZZ7vs559NEAxPqOPwtmMcBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hVFApGnt/yvmwhBTCG0fPTgjQGHW/A7eSaRw0PVqzl77BdGAg+ltrzxnUoBSh+zPDaizsIGGS56+mjTxELTKXh8bllHgU1jdT0z3wvBSJ0xe/glEILElyx6OyrWRUIRJve8sFuJAUug8/y1oU2Bhxqvu3mnEoPDlOq5O+zYRsGPJPY88p3KgUme8rx3I4+CRVht+rqpVITC0mh4PG9aB8GMojU8tGAMQYfccPu45ZFDBFYr+ftrVwWCECY3PLEcSYGK4DN8tiIOQgZZ7vs559NEAxPqOPxtmQcBjiP1/PMeS0FI3fH8N+RQAoUXrTp66hWFApGnt/yv2wiBTCG0fPTgzQHHG3A7eSaSA0PVqzl77BdGAk9ltnzxnUoBSh+y/HajDsIF2W56+mjUREKTKPi8blnHgU1jdTy0HwvBSF0xPDglEQKElux6OyrWRUJQ5vd88FwJAQug8/y1oY2Bhxqvu3mnEwODVKp5e+zYRsGOpPY88p3KgUmecnw3Y4/CBVgtuvqpVQSCkig4PG9aiAFMofS89GBMgUfccLv45ZGDRBYrufur1wYB0CX2/PEcycFKn/M8tiKOggZZ7vs559PEAxPpuPxt2UeBTeP1/POei4FI3bH8d+RQQkUXbPq66hWFApGnt/yv2wiBTCG0fPTgzUGHG3A7eSaSA0PVKzl77BeGQc9ltnzyHYpBSh9y/HajD0JFmS46+mjUREKTKPi8blnHwU1jdTy0H4wBiF0xPDglUUKElux6OyrWhUJQ5vd88NxJAQug8/y2IY3BxtnvO3mnU0ODVKp5e+0YhsGOpHY88p5LAUlecnw3Y9ACBVgtuvqp1QSCkif4PG9bCEFMofR89GBMwYdccLv45dHDRBXr+fur10YB0CX2/PGcycFKn/M8tiKOggZZrvs559PEAxPpuPxt2UeBTeP1/POei4FI3bH8d+RQQsUXbPq66pXFQlFnt/yv24iBTCF0PPThDYGHG3A7eSbSQ0PVKvl77BfGQc9ltnzyHYqBSh9y/HajD0JFmS46+mjUREKTKPi8blnHwU1jdTy0H4wBiFzw/DglUUKElqw6OyrWhUJQprd88NxJQQug8/y2IY4BxtnvO3mnU4ODVKo5PC0YxsGOpHY88p5LAUleMnw3Y9ACBVgtuvqp1QSCkif4PG9bCEFMofR89GBMwYdccLv45dHDRBXr+fur10YCECWAABJTklGSVhJTkc=');
      audio.play();
    }
  };

  const handleScan = async (barcode: string) => {
    try {
      if (onScan) {
        await onScan(barcode);
      }
      playScanSound();
      setTotalScanned(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar código de barras",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    totalScanned,
    handleScan
  };
}; 