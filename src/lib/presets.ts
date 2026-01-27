import { PresetModule } from "@/types/module";

export const presetModules: PresetModule[] = [
  {
    Marca: "Jinko",
    Referencia: "JKM410M-72H-V",
    Isc: "10.6",
    Voc: "50.4",
    Gop: "1000",
    Top: "25",
    Alpha_i: "0.048",
    Acelda: "0.0126",
    Ns: "144",
    Np: "1",
    n: "0.9273",
    Rs: "0.004",
    Rsh: "500",
    Pmax: "410"
  },
  {
    Marca: "Jinko",
    Referencia: "JKM470M-7RL3-V",
    Isc: "11.45",
    Voc: "53.95",
    Gop: "1000",
    Top: "25",
    Alpha_i: "0.048",
    Acelda: "0.0126",
    Ns: "144",
    Np: "1",
    n: "0.92",
    Rs: "0.0035",
    Rsh: "550",
    Pmax: "470"
  },
  {
    Marca: "BIG SUN",
    Referencia: "BigRef-IV-02",
    Isc: "5.75",
    Voc: "22.39",
    Gop: "1000",
    Top: "25",
    Alpha_i: "0.05",
    Acelda: "0.0243",
    Ns: "36",
    Np: "1",
    n: "1.2",
    Rs: "0.01",
    Rsh: "200",
    Pmax: "85"
  },
  {
    Marca: "Trina",
    Referencia: "TYN-85S5",
    Isc: "5.02",
    Voc: "22.1",
    Gop: "1000",
    Top: "25",
    Alpha_i: "0.05",
    Acelda: "0.0243",
    Ns: "36",
    Np: "1",
    n: "1.15",
    Rs: "0.015",
    Rsh: "180",
    Pmax: "85"
  }
];

export const defaultModule = presetModules[0];
