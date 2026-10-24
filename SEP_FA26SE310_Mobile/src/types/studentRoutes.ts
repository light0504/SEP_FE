export interface StudentStop {
  stopId: number;
  stopCode: string;
  name: string;
  address: string;
}

export interface StudentRoute {
  routeId: number;
  routeCode: string;
  name: string;
  stops: StudentStop[];
}
