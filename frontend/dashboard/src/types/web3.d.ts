declare interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (params: any) => void) => void;
    removeListener: (event: string, callback: (params: any) => void) => void;
    selectedAddress: string | null;
    isMetaMask?: boolean;
  };
}

declare type ProductData = {
  id: string;
  name: string;
  manufacturer: string;
  dateRegistered: string;
  status: 'active' | 'inactive';
};

declare type CounterfeitReport = {
  id: string;
  productId: string;
  productName: string;
  reportDate: string;
  location: string;
  status: 'pending' | 'confirmed' | 'false_alarm';
};
