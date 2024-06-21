import { FindOptionsWhere } from "typeorm";
import config from "../../config";
import * as MenuController from "../controllers/menuItem";
import * as PostController from "../controllers/post";
import { Block } from "../entity/Block";
import * as aliasess from "../helpers/alias.json";

/* export const update = async (patch: { page; type; ids }, id) => {
    const block = await Block.findOne(id);
    if (patch.type) {
          if (block.ids.length > 0 && block.contentType != patch.type)
            throw new ControllerException("clear the block to change the type");
 
        block.contentType = patch.type;
    }

    if (
        patch.ids.length > 0 &&
        patch.type &&
        block.contentType &&
        patch.type != block.contentType
    )
        throw new ControllerException("TYPE_MIS_MATCH");

    let objects = [];
    switch (patch.type) {
        case "ads":
            objects = await Post.findByIds(patch.ids, {
                where: { type: "advertisments" },
            });
            break;
        case "menus":
            objects = await MenuItem.findByIds(patch.ids);
            break;
        case "sliders":
            objects = await Post.findByIds(patch.ids, {
                where: { type: "sliders" },
            });
            break;

        default:
            break;
    }
    // block.ids = objects.map((object) => object.id);

    if (patch.page) {
        if (id in HomePageBlocksIds && patch.page != Pages.HOME_PAGE)
            throw new ControllerException("this block is only for home page");
        if (id in SupPagesBlocksIds && patch.page == Pages.HOME_PAGE)
            throw new ControllerException("this block is only for sup page");
        const pages = Object.values(Pages);
        if (!pages.includes(patch.page))
            throw new ControllerException("Page_not_found");
        //  block.page = patch.page;
    }

    await block.save();
    return {
        block: block.id,
        contentType: block.contentType,
        // page: block.page,
        objects,
    };
}; */

export const initiateBlocks = async () => {
    const SitePages = Object.values(aliasess);
    await Promise.all(
        SitePages.map(async (alias) => {
            const firstBlock = new Block();
            firstBlock.url = alias;
            firstBlock.index = 1;
            firstBlock.contentType = null;

            const secondBlock = new Block();
            secondBlock.url = alias;
            secondBlock.index = 2;
            secondBlock.contentType = null;

            await Block.save([firstBlock, secondBlock]);
        })
    );

    const homePageBlock = new Block();
    homePageBlock.url = config.siteUrl;
    homePageBlock.index = 1;
    homePageBlock.contentType = null;
    await homePageBlock.save();
};

export const getBlockByUrl = async (url, user, fromAdmin, language) => {
    const arr = url.split("/");
    arr.splice(0, 4);
    url = "/" + arr.join("/");
    url = decodeURI(url);

    const block = await Block.findOne({
        relations: ["contents"],
        where: { url },
    });

    // if (!block) throw new ControllerException("BLOCK_NOT_FOUND");
    if (!block) return null;
    let result;
    let objects;
    switch (block.contentType) {
        /*  case "sliders":
            objects = await Promise.all(
                block.contents.map(async (content) => {
                    try {
                        const post = await PostController.getById({
                            id: Number(content.contentId),
                            user,
                            fromAdmin,
                            language,
                        });

                        if (post.id) return post;
                    } catch (error) {}
                })
            );
            break;
        case "advertisments":
            objects = await Promise.all(
                block.contents.map(async (content) => {
                    try {
                        const post = await PostController.getById({
                            id: content.contentId,
                            user,
                            fromAdmin,
                            language,
                        });
                        if (post.id) return post;
                    } catch (error) {}
                })
            );
            break; */
        case "menus":
            objects = await Promise.all(
                block.contents.map(async (content) => {
                    try {
                        const menuItem = await MenuController.getTreeById(
                            content.contentId,
                            user,
                            language,
                            {}
                        );
                        if (menuItem.length) return menuItem;
                    } catch (error) {}
                })
            );
            break;
        default:
            break;
    }
    const filteredObjects =
        objects && objects.length
            ? objects.filter((object) => object != null)
            : [];
    return (result = {
        block: block.id,
        contentType: block.contentType,
        //  page: block.page,
        objects: filteredObjects,
    });
};

export const getList = async (user, language, page?) => {
    const queryClause: FindOptionsWhere<Block> = {};

    const blocks = await Block.find({
        relations: ["title"],
    });

    const result = [];
    let objects;
    /*   await Promise.all(
        blocks.map(async (block) => {
            switch (block.contentType) {
                case "sliders":
                    objects = await Promise.all(
                        block.ids.map(
                            async (id) =>
                                await PostController.getById(id, user, language)
                        )
                    );
                    break;
                case "ads":
                    objects = await Promise.all(
                        block.ids.map(
                            async (id) =>
                                await PostController.getById(id, user, language)
                        )
                    );
                    break;
                case "menus":
                    objects = await Promise.all(
                        block.ids.map(
                            async (id) =>
                                await MenuItemController.getById(
                                    id,
                                    user,
                                    language
                                )
                        )
                    );

                    break;
                default:
                    break;
            }

            result.push({ block: block.id, objects });
        })
    ); */
    return blocks;
};
