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
                    case "heading_2":
                        category = element.heading_2.text[0].text.content;
                        break;
                    case "child_page":
                        const myblogobject = {};
                        myblogobject.id = element.id;
                        myblogobject.category = category;
                        const blogresponse = await getPages(element.id)
                        if (blogresponse.icon.emoji) {
                            myblogobject.emoji = blogresponse.icon.emoji;
                        }
                        if (blogresponse.properties.title) {
                            if (blogresponse.properties.title.title[0].type === "text") {
                                myblogobject.title = blogresponse.properties.title.title[0].text.content;
                            }
                        }
                        if (blogresponse.cover.type === "external") {
                            myblogobject.imgsrc = blogresponse.cover.external.url;
                        }
                        blogs.push(myblogobject)
                        break;
                    case "paragraph":
                        let textsinparagraph = []
                        textsinparagraph = element.paragraph.text.map(element => { return { annotations: element.annotations, text: element.plain_text } })
                        // element.paragraph.text.forEach(element => {
                        //     textsinparagraph.push({ annotations: element.annotations, text: element.plain_text, list: false, childs: [] });
                        // });
                        blogs.push({ paragraph: textsinparagraph });
                        break;
                    case "bulleted_list_item":
                        let parentList = blogs[blogs.length - 1];
                        parentList.paragraph[0].list = true
                        parentList.paragraph[0].childs = element.bulleted_list_item.text.map(element => { return { annotations: element.annotations, text: element.plain_text } })
                        // element.bulleted_list_item.text.forEach(element => {
                        //     parentList.paragraph[0].childs.push({ annotations: element.annotations, text: element.plain_text });
                        // });
                        blogs[blogs.length - 1] = parentList;
                        break;
                    case "numbered_list_item":
                        let numparentList = blogs[blogs.length - 1];
                        numparentList.paragraph[0].list = true
                        numparentList.paragraph[0].childs = element.numbered_list_item.text.map(element => { return { annotations: element.annotations, text: element.plain_text } })
                        // element.numbered_list_item.text.forEach(element => {
                        //     numparentList.paragraph[0].childs.push({ annotations: element.annotations, text: element.plain_text });
                        // });
                        blogs[blogs.length - 1] = numparentList;
                        break;
                    default:
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