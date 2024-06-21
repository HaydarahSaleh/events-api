import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Version extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    version: string;

    @Column({ nullable: false })
    date: Date;

    @Column({ nullable: false })
    current: boolean;
}
