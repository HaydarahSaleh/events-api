import {
    AfterLoad,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
} from "typeorm";
import { ACL } from "../entity/ACL";
import { Block } from "./Block";
import { Category } from "./Category";
import { Detail } from "./Detail";
import { File } from "./File";
import { Message } from "./MessageTemplate";
import { Rate } from "./Rate";
import { ServiceRequest } from "./ServiceRequest";
import { SharedFields } from "./SharedFields";
import { SMTPConfig } from "./SmtpConfig";
import { TextData } from "./TextData";

@Entity()
export class Service extends SharedFields {
    @Column({ default: 0 })
    charges: number;

    @OneToOne((type) => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    duration: TextData;

    @OneToOne(() => File, (file) => file.id, { cascade: true })
    @JoinColumn()
    pagePicture: File;

    @Column("int", { array: true, nullable: true }) //saturday,friday
    excludedDays: number[];

    @Column({ default: "" })
    forInquiries: string;

    @Column({ default: 0 })
    transactions: number;

    @Column({ default: 0 })
    visits: number;

    @Column({ default: false })
    sendStaffEmail: Boolean;

    @Column({ nullable: true })
    toStaffEmail: string;

    @Column({ default: false })
    fromSync: Boolean;

    @ManyToOne(() => SMTPConfig, (smtp) => smtp.id, { nullable: true })
    @JoinColumn()
    smtp: SMTPConfig;

    @ManyToOne(() => Message, (message) => message.id, { nullable: true })
    @JoinColumn()
    template: Message;

    @ManyToOne(() => Message, (message) => message.id, { nullable: true })
    @JoinColumn()
    staffTemplate: Message;

    @ManyToOne(() => Message, (message) => message.id, { nullable: true })
    @JoinColumn()
    changeStatusTemplate: Message;

    @ManyToOne(
        (type) => ACL,
        (acl) => {
            acl.id;
        },
        { onDelete: "SET NULL" }
    )
    @JoinColumn()
    acl: ACL;

    @OneToOne(() => Rate, (rate) => rate.id, { cascade: true })
    @JoinColumn()
    rate: Rate;

    @OneToMany((type) => Detail, (detail) => detail.service, {
        cascade: true,
    })
    details: Detail[];

    @OneToMany((type) => ServiceRequest, (request) => request.service, {
        cascade: true,
    })
    requests: ServiceRequest[];

    @Column({ nullable: true })
    alias: string;

    @ManyToOne(() => Category, (category) => category.services, {
        onDelete: "CASCADE",
    })
    serviceCategory: Category;

    @OneToOne(() => Block, (block) => block.id, { cascade: true })
    @JoinColumn()
    block: Block;

    @AfterLoad()
    private increase() {
        const visits = this.visits;

        Service.update({ id: this.id }, { visits: visits + 1 });
    }
}
