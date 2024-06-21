import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { Post } from "./Post";
import { ACL } from "./ACL"; // ACl reffer's to Access-control list
import { SharedFields } from "./SharedFields";
import { Category } from "./Category";
import { TextData } from "./TextData";
import { Rate } from "./Rate";
@Entity()
export class Link extends SharedFields {
    @Column()
    link: string;

    @ManyToOne((type) => Post, (post) => post.links, { cascade: true })
    post: Post;

    @ManyToOne(
        (type) => ACL,
        (acl) => {
            acl.id;
        }, { onDelete: "SET NULL" }
    )
    @JoinColumn()
    acl: ACL;

    @ManyToOne(
        (type) => Category,
        (category) => {
            category.id;
        }
    )
    @JoinColumn()
    category: Category;

    @OneToOne(() => TextData, (text) => text.id, { cascade: true })
    @JoinColumn()
    alt: TextData;

    @OneToOne(() => Rate, (rate) => rate.id,{cascade:true})
    @JoinColumn()
    rate: Rate; 

    async deleteAllContent() {
        const link = await Link.findOne( {
            where:{id:this.id},
            relations: ["title", "description"],
        });
        await link.remove();
        if (link.title) await link.title.remove();
        if (link.description) await link.description.remove();
    }
}
