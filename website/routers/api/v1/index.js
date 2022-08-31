var express = require('express'),
    router = express.Router();
var bots = require('../../../../models/bot');
var votes = require('../../../../models/votes');
var servers = require('../../../../models/server');
const client = require('../../../index');
router.get('/', function (req, res) {
    res.json({
        message: "Welcome to the bots API, please use /v1"
    })
});
router.get('/search/:id', function (req, res) {
    bots.find({ $or: [{ id: { $regex: req.params.id } }, { name: { $regex: req.params.id } }] }, async function (err, bot) {
        if (err) throw err;
        if (!bot) {
            return
        } else {
            var serverArray = [];
            const serverr = await servers.find({ $or: [{ id: { $regex: req.params.id } }, { name: { $regex: req.params.id } }] })
            if (!serverr) {
                return
            } else {
                serverr.forEach(function (server1) {
                    serverArray.push({
                        "name": server1.name, "id": server1.id, "description": server1.description, type: "server", "avatar": 'https://cdn.discordapp.com/icons/'+server1.id+'/'+server1.icon+'.webp?size=1024' })
                });
            }


            bot.forEach(function (server) {
                serverArray.push({ "name": server.name, "id": server.id, "description": server.description, type: "bot" });
            });
            res.json({
                array: serverArray
            })

        }
    })
})
const applyText = (canvas, text) => {
    const context = canvas.getContext('2d');
    let fontSize = 70;

    do {
        context.font = `30px sans-serif`;
    } while (context.measureText(text).width > canvas.width - 300);

    return context.font;
};
const { createCanvas, loadImage, Image } = require('canvas')
const { readFile } = require('fs/promises');

router.get('/server/banner/:id', function (req, res) {
    // Get one server and draw it on the canvas
    servers.findOne({ id: req.params.id }, async function (err, server) {
        if (err) throw err;
        if (!server) {
            return
        } else {
            const serverr = await global.bsl.guilds.cache.get(req.params.id)
            if (!serverr) return
            const serverName = server.name
            const serverDescription = server.description
            const serverMembers = serverr.memberCount
            // Load the image
            const avatar = await loadImage(`https://cdn.discordapp.com/icons/${serverr.id}/${serverr.icon}.jpg`)
            // Draw the image
            const canvas = createCanvas(700, 250);
            const context = canvas.getContext('2d');
            if (req.query.background) {
                try {
                    const background = await loadImage(req.query.background)
                    context.drawImage(background, 0, 0, canvas.width, canvas.height);
                } catch (e) {
                    res.send("Invalid Background")
                    return
                }
            } else {
                const background = await readFile('./website/public/img/wallpaper.jpg');
                const backgroundImage = new Image();
                backgroundImage.src = background;
                context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
            }
            context.strokeStyle = '#0099ff';
            context.strokeRect(0, 0, canvas.width, canvas.height);

            context.font = '15px sans-serif';
            context.fillStyle = '#fff';
            context.fillText('©️ BotsCord.xyz', canvas.width / 1.2, canvas.height / 1.05);
            context.font = '30px sans-serif';

            context.fillStyle = '#ffffff';
            context.fillText(serverName, canvas.width / 2.7, canvas.height / 1.8);
            context.font = '18px sans-serif';

            context.fillText(`😊 ${serverMembers}`, canvas.width / 2.7, canvas.height / 1.1);
            context.fillText(`❤️ ${server.votes}`, canvas.width / 2.1, canvas.height / 1.1);

            context.beginPath();
            context.arc(125, 125, 100, 0, Math.PI * 2, true);
            context.closePath();
            context.clip();
            context.drawImage(avatar, 25, 25, 200, 200);
            res.setHeader('Content-Type', 'image/png');
            canvas.pngStream().pipe(res);
        }
    })

})

router.use(function (req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).json({ error: 'No credentials sent!' });
    } else {
        bots.findOne({ token: req.headers.authorization }, function (err, bot) {
            if (err) {
                res.status(503).json({
                    error: "Something went wrong"
                })
            }
            if (bot) {
                if (bot.token == req.headers.authorization) {
                    next();
                }
            } else {
                res.status(403).json({
                    error: "Unauthorized"
                })
            }
        })
    }
    next();
});
router.post('/bots/servers', function (req, res) {
    if (req.headers.authorization) {
        bots.findOne({ token: req.headers.authorization }, function (err, bot) {
            if (err) {
                res.status(503).json({
                    error: "Something went wrong"
                })
            }
            if (bot) {
                if (bot.token == req.headers.authorization) {
                    bot.servers = req.headers.servercount;
                    bot.save(function (err) {
                        if (err) {
                            res.status(503).json({
                                error: "Something went wrong"
                            })
                        } else {
                            res.status(200).json({
                                message: "Success"
                            })
                        }
                    })
                } else {
                    res.status(403).json({
                        error: "Invalid token or bot"
                    })
                }
            } else {
                res.status(403).json({
                    error: "Invalid token or bot"
                })
            }
        })
    } else {
        res.status(401).json({
            message: "Please provide a bot token"
        })
    }
});

router.get('/bots/search/:id', function (req, res) {
    bots.findOne({ id: req.params.id }, function (err, bot) {
        if (err) {
            res.status(503).json({
                error: "Something went wrong"
            })
        }
        if (bot) {
            res.status(200).json({
                id: bot.id,
                name: bot.name,
                description: bot.description,
                long_description: bot.long_description,
                tags: bot.tags,
                owners: bot.owners,
                premium: bot.premium,
                servers: bot.servers,
                users: bot.users,
                votes: bot.votes
            })
        } else {
            res.status(403).json({
                error: "No bot found"
            })
        }
    });
});
router.get('/bots/checkvote/:id', function (req, res) {
    votes.findOne({ user: req.params.id }, function (err, vote) {
        if (err) {
            res.status(503).json({
                error: "Something went wrong"
            })
        }
        if (vote) {
            res.status(200).json({
                vote: true
            })
        } else {
            res.status(403).json({
                vote: false
            })
        }
    });
})


module.exports = router;