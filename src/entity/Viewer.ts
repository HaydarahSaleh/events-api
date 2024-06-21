import { Column, Entity } from "typeorm";
import { IViewerItem } from "../interface/viewer.interface";
import { SharedFields } from "./SharedFields";
import { ViewerType } from "./enum/Type";

@Entity()
export class Viewer extends SharedFields {
    @Column()
    type: ViewerType;

    @Column("json")
    items: IViewerItem[];
}

// const menu =
// [
//     { "id": 10 },
//     {
//         "id": 12,
//         "childs": [
//                 { "id": 22 },
//                 { "id": 14,
//                   "childs": [
//                             { "id": 8 },
//                             { "id": 32 }
//                           ]
//                 }
//         ],
//     },
// ];
