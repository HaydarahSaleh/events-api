import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    BaseEntity,
} from "typeorm";
import { Subscriber } from "./Subscriber";
import { PostType } from "./enum/Type";
@Entity()
export class SubscribersDetails extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "enum", enum: Object.values(PostType) })
    type: PostType;

    @ManyToOne(
        (type) => Subscriber,
        (subscriber) => {
            subscriber.subjects;
        },
        { onDelete: "CASCADE" }
    )
    subscriber: Subscriber[];
}
