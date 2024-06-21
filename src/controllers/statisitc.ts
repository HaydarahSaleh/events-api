import { AppDataSource } from "..";
import { Configuration } from "../entity/Configuration";
import { Visitor } from "../entity/Visitors";

export const getStatistics = async () => {
    let result =
        await AppDataSource.query(`select  count(*), 'totalNews' as identifier   from post  where post ."type" ='news' 
Union
select  count(*), 'publishedNews' as identifier   from post  where post ."type" ='news' and post ."publishMode" <> 0
Union
select  count(*), 'totalEvents' as identifier   from post  where post ."type" ='events'
Union
select  count(*), 'publishedEvents' as identifier   from post  where post ."type" ='events' and post ."publishMode" <> 0
 Union
select  count(*), 'totaIitiatives' as identifier   from post  where post ."type" ='initiatives'
Union
select  count(*), 'publishedInitiatives' as identifier   from post  where post ."type" ='initiatives' and post ."publishMode" <> 0
 Union
select  count(*), 'totaInvestmentOpportunities' as identifier   from post  where post ."type" ='investmentOpportunities'
Union
select  count(*), 'publishedInvestmentOpportunities' as identifier   from post  where post ."type" ='investmentOpportunities' and post ."publishMode" <> 0
Union
select  count(*), 'totaOpenDatas' as identifier   from post  where post ."type" ='openDatas'
Union
select  count(*), 'publishedOpenDatas' as identifier   from post  where post ."type" ='openDatas' and post ."publishMode" <> 0
Union
select  count(*), 'totaPublications' as identifier   from post  where post ."type" ='publications'
Union
select  count(*), 'publishedPublications' as identifier   from post  where post ."type" ='publications' and post ."publishMode" <> 0
Union
select  count(*), 'totaLiveBroadcasts' as identifier   from post  where post ."type" ='liveBroadcasts'
Union
select  count(*), 'publishedLiveBroadcasts' as identifier   from post  where post ."type" ='liveBroadcasts' and post ."publishMode" <> 0
union 
select  count(*),'totalSurveys' as identifier from survey s where s."type" ='survey'
union 
select  count(*),'publishedSurveys' as identifier from survey s where s."type" ='survey' and s."publishMode" <> 0
union 
select  count(*),'totalPolls' as identifier from survey s where s."type" ='poll'
union 
select  count(*),'publishedPolls' as identifier from survey s where s."type" ='poll' and s."publishMode" <> 0
union 
select  count(*),'totalCareers' as identifier from career c 
union 
select  count(*),'publishedCareers' as identifier from career c where c."publishMode" <> 0

`);
    const object = {};
    result.map((singleResult) => {
        object[singleResult.identifier] = Number(singleResult.count);
    });
    object["siteVisitors"] = await Visitor.count();
    return object;
};

export const contactLinks = async () => {
    const keys = ["WEBSITE", "PHONE", "EMAIL", "INSTAGRAM"];
    const links = [];
    await Promise.all(
        keys.map(async (key) => {
            const { title, value } = await Configuration.findOne({
                where: { key },
                relations: ["title"],
            });

            links.push({
                key,
                value,
                title,
            });
        })
    );

    return links;
};
