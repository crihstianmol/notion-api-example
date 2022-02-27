const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const getBlocks = async (block_id) => {
    const blocks = await notion.blocks.children.list({ block_id: block_id, page_size: 100 });
    return blocks;
}

const getPages = async (page_id) => {
    const pages = await notion.pages.retrieve({ page_id: page_id });
    return pages;
}

const formatBlocks = async (blocks, blogs = []) => {
    let category = ''
    switch (blocks.object) {
        case "list":
            for (const element of blocks.results) {
                switch (element.type) {
                    case "column_list":
                        const blockcl = await getBlocks(element.id);
                        blogs = await formatBlocks(blockcl, blogs);
                        break;
                    case "column":
                        const blockc = await getBlocks(element.id);
                        blogs = await formatBlocks(blockc, blogs);
                        break;
                    case "child_page":
                        const blogresponse = await getPages(element.id)
                        const myblogobject = {};
                        myblogobject.id = element.id;
                        myblogobject.category = category;
                        myblogobject.emoji = blogresponse.icon.emoji ? blogresponse.icon.emoji : undefined;
                        myblogobject.title = blogresponse.properties.title ? (blogresponse.properties.title.title[0].type === "text" ? blogresponse.properties.title.title[0].text.content : undefined) : undefined;
                        myblogobject.imgsrc = blogresponse.cover ? (blogresponse.cover.type === "external" ? blogresponse.cover.external.url : undefined) : undefined;
                        blogs.push(myblogobject)
                        break;
                    case "paragraph":
                        blogs.push({ paragraph: element.paragraph.text.map(element => ({ annotations: element.annotations, text: element.plain_text, hasurl: element.href !== null && element.href !== undefined ? true : false, url: element.href !== null ? element.href : undefined })) });
                        break;
                    case "heading_1":
                        blogs.push({ header1: element.heading_1.text.map(element => ({ annotations: element.annotations, text: element.plain_text, hasurl: element.href !== null && element.href !== undefined ? true : false, url: element.href !== null ? element.href : undefined })) });
                        break;
                    case "heading_2":
                        blogs.push({ header2: element.heading_2.text.map(element => ({ annotations: element.annotations, text: element.plain_text, hasurl: element.href !== null && element.href !== undefined ? true : false, url: element.href !== null ? element.href : undefined })) });
                        break;
                    case "heading_3":
                        blogs.push({ header3: element.heading_3.text.map(element => ({ annotations: element.annotations, text: element.plain_text, hasurl: element.href !== null && element.href !== undefined ? true : false, url: element.href !== null ? element.href : undefined })) });
                        break;
                    case "bulleted_list_item":
                        let parentList = blogs[blogs.length - 1];
                        parentList.list = true
                        parentList.childs = parentList.childs ? parentList.childs : [];
                        parentList.childs = parentList.childs.concat(element.bulleted_list_item.text.map(element => ({ annotations: element.annotations, text: element.plain_text, hasurl: element.href !== null && element.href !== undefined ? true : false, url: element.href !== null ? element.href : undefined, ordered: false })))
                        blogs[blogs.length - 1] = parentList;
                        break;
                    case "numbered_list_item":
                        let numparentList = blogs[blogs.length - 1];
                        numparentList.list = true
                        numparentList.childs = numparentList.childs ? numparentList.childs : [];
                        numparentList.childs = numparentList.childs.concat(element.numbered_list_item.text.map(element => ({ annotations: element.annotations, text: element.plain_text, hasurl: element.href !== null && element.href !== undefined ? true : false, url: element.href !== null ? element.href : undefined, ordered: true })))
                        blogs[blogs.length - 1] = numparentList;
                        break;
                    case "image":
                        blogs.push({ image: { caption: element.image.caption.map(element => (element.plain_text)).join(' '), url: element.image.external ? element.image.external.url : (element.image.file ? element.image.file.url : '') } })
                        break
                    case "video":
                        blogs.push({ video: { caption: element.video.caption.map(element => (element.plain_text)).join(' '), url: element.video.external ? element.video.external.url : (element.video.file ? element.video.file.url : '') } })
                        break
                    case "embed":
                        blogs.push({ embed: { caption: element.embed.caption.map(element => (element.plain_text)).join(' '), url: element.embed.url } });
                        break
                    case "quote":
                        blogs.push({ quote: element.quote.text.map(element => ({ annotations: element.annotations, text: element.plain_text, hasurl: element.href !== null && element.href !== undefined ? true : false, url: element.href !== null ? element.href : undefined })) });
                        break
                    case "callout":
                        blogs.push({ category: element.callout.text.map(element => ({ annotations: element.annotations, text: element.plain_text, hasurl: element.href !== null && element.href !== undefined ? true : false, url: element.href !== null ? element.href : undefined })) });
                        break
                    default:
                        // console.error("element not parsed")
                        // console.info({ type: element.type, element: element })
                        break;
                }
            }
            break;
        case "block":
            break;
        default:
            break;
    }
    return blogs
}

const getBlogs = async (req, res) => {
    let blogs = []
    getBlocks(process.env.NOTION_BLOG_PAGE).then((blockresp) => {
        formatBlocks(blockresp, blogs).then((resp) => {
            blogs = resp
            return res.send(blogs)
        }).catch((error) => {
            return res.status(500).send({ error })
        })
    }).catch((error) => {
        return res.status(500).send({ error })
    })
}

const getBlog = async (req, res) => {
    let blogid = req.query.id ? req.query.id : "";
    let blog = [];
    let blogObject = {};
    getBlocks(blogid).then((blockresp) => {
        formatBlocks(blockresp, blog).then((resp) => {
            blog = resp
            blogObject.blogparagraphs = blog
            return res.send(blogObject)
        }).catch((error) => {
            return res.status(500).send({ error })
        })
    }).catch((error) => {
        return res.status(500).send({ error })
    })
}

module.exports = {
    getBlogs, getBlog
};