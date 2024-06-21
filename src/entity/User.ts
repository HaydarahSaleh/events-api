import {
    AfterLoad,
    Entity,
    Column,
    OneToMany,
    CreateDateColumn,
    BeforeInsert,
    BeforeUpdate,
    BaseEntity,
    PrimaryGeneratedColumn,
    OneToOne,
    ManyToMany,
    JoinTable,
    BeforeRemove,
    ManyToOne,
} from "typeorm";
import * as jwt from "jsonwebtoken";
import { Language } from "./enum/Language";
import { Length } from "class-validator";
import * as bcrypt from "bcryptjs";

import { Feedback } from "./Feedback";
import { Post } from "./Post";
import { SMTPConfig } from "./SmtpConfig";
import { Configuration } from "./Configuration";
import { JoinColumn } from "typeorm";
import { TextData } from "./TextData";
import { UserGroup } from "./UserGroup";
import { Comment } from "./Comment";
import { ServiceRequest } from "./ServiceRequest";
import { Replay } from "./Replay";
import { PrefferedLanguage, PrefferedMean, UserType } from "./enum/UserType";
import ControllerException from "../exceptions/ControllerException";
import config from "../../config";
@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    userName: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ default: 0 })
    otpTries: number;

    @Column({ nullable: true })
    jwtId: string;

    @Column({ select: false, nullable: true })
    otp: string;

    @Column({ unique: true })
    @Length(1, 254)
    email: string;

    @Column({ default: false, select: true })
    emailConfirmed: boolean;

    @Column({ nullable: true, select: false })
    @Length(6)
    emailConfirmationCode: string;

    @Column({ nullable: true, select: false })
    emailConfirmationCodeDate: Date;

    @Column({ select: false })
    password: string;

    @Column({ nullable: true, select: false })
    @Length(6)
    passwordResetingCode: string;

    @Column({ nullable: true, select: false })
    passwordResetingCodeDate: Date;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false, select: true })
    enableOtp: boolean;

    @Column({ nullable: true, select: false })
    lastPasswordChange: Date;

    @Column({
        type: "simple-array",
        enum: PrefferedMean,
        default: PrefferedMean.EMAIL,
    })
    prefferedMean: string[];

    @Column({
        type: "enum",
        enum: PrefferedLanguage,
        default: PrefferedLanguage.ARABIC,
    })
    prefferedLanguage: PrefferedLanguage;

    @OneToMany((type) => ServiceRequest, (request) => request.createdBy, {
        nullable: true,
    })
    requests: ServiceRequest[];

    @Column({ default: true })
    notificationByEmail: boolean;

    @Column({ default: true })
    notificationBySms: boolean;

    @Column({
        type: "enum",
        enum: Object.values(Language),
        default: Language.ARABIC,
    })
    language: Language;

    @ManyToMany((type) => UserGroup, (userGroup) => userGroup.users)
    @JoinTable()
    groups: UserGroup[];

    @Column()
    @CreateDateColumn()
    registeredAt: Date;

    @Column()
    @CreateDateColumn()
    lastVisitAt: Date;

    @OneToMany((type) => Post, (post) => post.createdBy)
    updatedPosts: Post[];

    @OneToMany((type) => Replay, (replay) => replay.createdBy)
    replays: Replay[];

    @OneToMany((type) => Post, (post) => post.updatedBy)
    createdPosts: Post[];

    @OneToMany((type) => Comment, (Comment) => Comment.createdBy)
    updatedComments: Comment[];

    @OneToMany((type) => Comment, (Comment) => Comment.updatedBy)
    createdComments: Comment[];

    @OneToMany((type) => SMTPConfig, (sc) => sc.createdBy)
    updatedSMTPConfigs: SMTPConfig[];

    @OneToMany((type) => SMTPConfig, (sc) => sc.updatedBy)
    createdSMTPConfigs: SMTPConfig[];

    @OneToMany((type) => Configuration, (conf) => conf.createdBy)
    updatedConfigurations: Configuration[];

    @OneToMany((type) => Configuration, (conf) => conf.updatedBy)
    createdConfigurations: Configuration[];

    /* @OneToMany((type) => Feedback, (feedback) => feedback.post)
    feedbacks: Feedback[]; */

    @Column({ type: "enum", enum: UserType, default: UserType.EMPLOYEE })
    type: UserType;

    @OneToOne(() => TextData, (textData) => textData.id, { cascade: true })
    @JoinColumn()
    name: TextData;

    private databasePassword: string;

    @AfterLoad()
    private loadTempPassword(): void {
        this.databasePassword = this.password;
    }

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (this.databasePassword === this.password) return;
        this.password = bcrypt.hashSync(this.password, 10);
    }

    async validatePassword(password: string) {
        return await bcrypt.compare(password, this.password);
    }

    static async findByEmailAndPassword(email: string, password: string, type) {
        const user = await User.createQueryBuilder("user")
            .select(["user.id", "user.password"])
            .where("user.email = :email and user.type= :type ")

            .setParameters({ email, type })
            .getOne();

        if (!user) return null;

        const passwordsMatch = await user.validatePassword(password);
        if (!passwordsMatch) return null;

        return (
            User.findOne({
                where: { id: user.id },
                relations: [
                    "name",
                    "groups",
                    "groups.acls",
                    "groups.permissions",
                    "groups.parent",
                ],
            }) || null
        );
    }

    static async findByEmailAndOtp(email: string, otp: string) {
        const user = await User.createQueryBuilder("user")
            .select(["user.id", "user.otp"])
            .where("user.email = :email")
            .setParameters({ email })
            .getOne();

        if (!user) return null;
        if (!user.otp) throw new ControllerException("INVALID_ACTION");
        let dataStoredInToken = null;
        try {
            dataStoredInToken = jwt.verify(user.otp, config.jwt.secret, {
                issuer: config.jwt.issuer,
                audience: config.jwt.audience,
            });
        } catch (err) {
            throw new ControllerException("INVALID_TOKEN");
        }
        if (!dataStoredInToken) throw new ControllerException("INVALID_TOKEN");
        if (typeof dataStoredInToken.otp !== "number")
            throw new ControllerException("INVALID_TOKEN");

        if (otp != dataStoredInToken.otp)
            throw new ControllerException("WRONG_CREDENTIALS");

        /*  user.otpTries += 1;
            if (user.otpTries == 3) {
                user.otp = null;
                throw new ControllerException("MAX_TRIES_FOR_THIS_CODE");
            }
            await User.update(user); */

        return (
            User.findOne({
                where: { id: user.id },
                relations: ["groups", "groups.acls", "groups.permissions"],
            }) || null
        );
    }

    deleteAllContent = async () => {
        const user = await User.findOne({
            where: { id: this.id },
            relations: ["requests"],
        });
        if (user.requests.length)
            await Promise.all(
                user.requests.map(async (requet) => {
                    return await requet.deleteAllContent();
                })
            );
        await user.remove();
    };
}
