import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm";

@Entity()
export class TextData extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "text", nullable: true })
    ar: string;

    @Column({ type: "text", nullable: true })
    en: string;
    
    @Column({ type: "text", nullable: true })
    fr: string;

    @Column("tsvector", { nullable: true, select: false })
    document_with_weights: any;
}
