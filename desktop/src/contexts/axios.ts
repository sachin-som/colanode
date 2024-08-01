import { createContext, useContext } from "react";
import { AxiosInstance } from "axios";

export const AxiosContext = createContext<AxiosInstance>(
  {} as AxiosInstance
);

export const useAxios = () => useContext(AxiosContext);
