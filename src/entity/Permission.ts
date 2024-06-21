import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Asset } from "./Asset";
import { Post } from "./Post";
import { UserGroup } from "./UserGroup";
@Entity()
export class Permission extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: 0 }) //0: notSet,1:inherit,2:allow,3:deny
    add: number;

    @Column({ default: 0 })
    editAny: number;

    @Column({ default: 0 })
    editOwn: number;

    @Column({ default: 0 })
    deleteOwn: number;

    @Column({ default: 0 })
    deleteAny: number;

    @Column({ default: 0 })
    approve: number;

    @Column({ default: 0 })
    publish: number;

    @Column({ default: 0 })
    publishAfterApprove: number;

    @Column({ default: 0 })
    accessAdministrationInterface: number;

    @Column({ default: 0 })
    view: number;

    @Column({ default: 0 })
    viewDeleted: number;

    @Column({ default: 0 })
    viewVersions: number;

    @ManyToOne((type) => UserGroup, (userGroup) => userGroup.permissions)
    userGroup: UserGroup;

    @ManyToOne((type) => Asset, (asset) => asset.permissions, {
        nullable: true,
    })
    @JoinColumn()
    asset: Asset;
}

// What Users Can See
/*
Create a set of Access Levels (public,  super user automatically added)
Create a User Group (public,  super user automatically added)
        Assign Access Levels to User Group 
        Assign each item to be viewed to one Access Level
*/

// What Users Can Do
/*
Global Permissions Configuration + Local Permissions Configuration
category level + post level 

---checks the permission for this combination of user, item, and action---

*/
//Permisssions
/*
Not Set
Inherit
Deny
Allow
*/
//Permission Hierarchy Levels
/*
Global Configuration
Component
category
post
*/

//Setup
/*
When CMS is installed, these are set to ACL  initial default settings*/

/*

Global
Component 
    Posts
    Users
    Menus
category
post
*/

/*
new records will be added to this table on:
add userGroup //addedRowsCount=userGroupCount*(postsCount+categoryCount)
add post      //addedRowsCount=userGroupCount*(postsCount)
add category  //addedRowsCount=userGroupCount*(categoryCount)

records will be deleted from this table on:
remove userGroup-post-category

records will be updated in this table on:
update post-category permission + Global and Component direct update


*/
