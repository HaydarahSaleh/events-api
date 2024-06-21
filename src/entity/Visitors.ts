import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Visitor extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    ip: String;
}
