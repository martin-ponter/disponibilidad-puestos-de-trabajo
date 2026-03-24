export type Office = "Toledo" | "Madrid" | "Alcobendas" | "Consuegra";

export interface MapLabelFeature {
  type: "label";
  id: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MapLineFeature {
  type: "line";
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MapRectFeature {
  type: "rect";
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rounded?: boolean;
}

export interface MapDoorFeature {
  type: "door";
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  side?: "left" | "right" | "top" | "bottom";
}

export type OfficeMapFeature =
  | MapLabelFeature
  | MapLineFeature
  | MapRectFeature
  | MapDoorFeature;

export interface OfficeMapDesk {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OfficeMapDefinition {
  id: string;
  office: Office;
  room: string;
  width: number;
  height: number;
  features: OfficeMapFeature[];
  desks: OfficeMapDesk[];
}

export const officeMaps: Record<string, OfficeMapDefinition> = {
  "Toledo::Sala Laboral-Fiscal": {
    id: "toledo-sala-laboral-fiscal",
    office: "Toledo",
    room: "Sala Laboral-Fiscal",
    width: 1000,
    height: 1120,
    features: [
      {
        type: "label",
        id: "title",
        text: "SALA LABORAL-FISCAL",
        x: 315,
        y: 26,
        w: 370,
        h: 36,
      },
      {
        type: "rect",
        id: "room-border",
        x: 250,
        y: 110,
        w: 540,
        h: 900,
        rounded: true,
      },
      {
        type: "rect",
        id: "upper-block",
        x: 360,
        y: 170,
        w: 320,
        h: 510,
        rounded: true,
      },
      {
        type: "rect",
        id: "lower-block",
        x: 375,
        y: 760,
        w: 290,
        h: 190,
        rounded: true,
      },
      {
        type: "label",
        id: "entrada-label",
        text: "ENTRADA",
        x: 92,
        y: 640,
        w: 120,
        h: 28,
      },
      {
        type: "label",
        id: "pasillo-label",
        text: "PASILLO",
        x: 460,
        y: 705,
        w: 120,
        h: 24,
      },
      {
        type: "line",
        id: "ventanas-line",
        x: 300,
        y: 1048,
        w: 450,
        h: 2,
      },
      {
        type: "label",
        id: "ventanas-label",
        text: "VENTANAS",
        x: 445,
        y: 1075,
        w: 140,
        h: 24,
      },
    ],
    desks: [
      { id: "TOL-14", x: 360, y: 170, w: 160, h: 102 },
      { id: "TOL-15", x: 520, y: 170, w: 160, h: 102 },

      { id: "TOL-12", x: 360, y: 272, w: 160, h: 102 },
      { id: "TOL-13", x: 520, y: 272, w: 160, h: 102 },

      { id: "TOL-10", x: 360, y: 374, w: 160, h: 102 },
      { id: "TOL-11", x: 520, y: 374, w: 160, h: 102 },

      { id: "TOL-08", x: 360, y: 476, w: 160, h: 102 },
      { id: "TOL-09", x: 520, y: 476, w: 160, h: 102 },

      { id: "TOL-06", x: 360, y: 578, w: 160, h: 102 },
      { id: "TOL-07", x: 520, y: 578, w: 160, h: 102 },

      { id: "TOL-04", x: 375, y: 760, w: 145, h: 95 },
      { id: "TOL-05", x: 520, y: 760, w: 145, h: 95 },

      { id: "TOL-02", x: 375, y: 855, w: 145, h: 95 },
      { id: "TOL-03", x: 520, y: 855, w: 145, h: 95 },
    ],
  },

  "Toledo::Sala Jurídico": {
    id: "toledo-sala-juridico",
    office: "Toledo",
    room: "Sala Jurídico",
    width: 1000,
    height: 560,
    features: [
      {
        type: "label",
        id: "title",
        text: "SALA JURÍDICO",
        x: 360,
        y: 26,
        w: 280,
        h: 34,
      },
      {
        type: "rect",
        id: "room-border",
        x: 140,
        y: 104,
        w: 700,
        h: 360,
        rounded: true,
      },
      {
        type: "rect",
        id: "desk-block",
        x: 230,
        y: 180,
        w: 510,
        h: 190,
        rounded: true,
      },
      {
        type: "line",
        id: "ventanas-line",
        x: 112,
        y: 118,
        w: 2,
        h: 350,
      },
      {
        type: "label",
        id: "ventanas-label",
        text: "VENTANAS",
        x: 18,
        y: 255,
        w: 78,
        h: 24,
      },
      {
        type: "label",
        id: "entrada-label",
        text: "ENTRADA",
        x: 880,
        y: 260,
        w: 90,
        h: 24,
      },
    ],
    desks: [
      { id: "TOL-17", x: 230, y: 180, w: 170, h: 95 },
      { id: "TOL-19", x: 400, y: 180, w: 170, h: 95 },
      { id: "TOL-21", x: 570, y: 180, w: 170, h: 95 },

      { id: "TOL-16", x: 230, y: 275, w: 170, h: 95 },
      { id: "TOL-18", x: 400, y: 275, w: 170, h: 95 },
      { id: "TOL-20", x: 570, y: 275, w: 170, h: 95 },
    ],
  },

 "Toledo::Sala Reuniones Toledo": {
  id: "toledo-sala-reuniones-toledo",
  office: "Toledo",
  room: "Sala Reuniones Toledo",
  width: 1000,
  height: 560,
  features: [
    {
      type: "label",
      id: "title",
      text: "SALA REUNIONES TOLEDO",
      x: 270,
      y: 24,
      w: 460,
      h: 34,
    },
    {
      type: "line",
      id: "ventanas-line",
      x: 275,
      y: 102,
      w: 450,
      h: 2,
    },
    {
      type: "label",
      id: "ventanas-label",
      text: "VENTANAS",
      x: 445,
      y: 58,
      w: 110,
      h: 22,
    },
    {
      type: "rect",
      id: "room-border",
      x: 155,
      y: 145,
      w: 690,
      h: 315,
      rounded: true,
    },
    {
      type: "rect",
      id: "meeting-table",
      x: 250,
      y: 225,
      w: 500,
      h: 170,
      rounded: true,
    },
    {
      type: "label",
      id: "entrada-label",
      text: "ENTRADA",
      x: 650,
      y: 500,
      w: 110,
      h: 24,
    },
  ],
  desks: [{ id: "TOL-23", x: 250, y: 225, w: 500, h: 170 }],
},
  "Toledo::Despacho Luis": {
    id: "toledo-despacho-luis",
    office: "Toledo",
    room: "Despacho Luis",
    width: 1000,
    height: 560,
    features: [
      {
        type: "label",
        id: "title",
        text: "DESPACHO LUIS",
        x: 325,
        y: 24,
        w: 350,
        h: 34,
      },
      {
        type: "line",
        id: "ventanas-line",
        x: 275,
        y: 102,
        w: 450,
        h: 2,
      },
      {
        type: "label",
        id: "ventanas-label",
        text: "VENTANAS",
        x: 445,
        y: 58,
        w: 110,
        h: 22,
      },
      {
        type: "rect",
        id: "room-border",
        x: 250,
        y: 145,
        w: 500,
        h: 340,
        rounded: true,
      },
      {
        type: "rect",
        id: "desk-block",
        x: 360,
        y: 220,
        w: 280,
        h: 170,
        rounded: true,
      },
      {
        type: "label",
        id: "entrada-label",
        text: "ENTRADA",
        x: 445,
        y: 510,
        w: 110,
        h: 24,
      },
    ],
    desks: [{ id: "TOL-22", x: 360, y: 220, w: 280, h: 170 }],
  },
};