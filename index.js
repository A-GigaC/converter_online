"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
const dotenv = require('dotenv');
// get config vars
dotenv.config();
// access config var
process.env.TOKEN_SECRET;
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const count = yield prisma.convertations.count();
    res.json({ count: count });
}));
function generateAccessToken(username) {
    return jsonwebtoken_1.default.sign(username, process.env.TOKEN_SECRET, {
        expiresIn: '1800s',
    });
}
// middle_ware
// 
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null)
        return res.sendStatus(401);
    try {
        const { username } = jsonwebtoken_1.default.verify(token, process.env.TOKEN_SECRET);
        req['username'] = username;
        next();
    }
    catch (error) {
        res.status(403).send('теряйся наху');
        return;
    }
}
/* the main functionality */
app.post('/', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // authenticate user
    const result = yield prisma.convertations.count({
        where: {
            actor: {
                username: req.username,
            },
            startedAt: {
                gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
        },
    });
    // forming response
    if (result < 10) {
        res.status(200).send('конверть пока можешь');
    }
    else {
        res.status(400).send('пшол наху, лимит зеро. ёпт');
    }
}));
/* registr new user */
app.post('/reg', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const getUser = yield prisma.user.findFirst({
        where: { username },
    });
    if (getUser) {
        res.status(400).send('This username already used');
        return;
    }
    // add user to db
    const post = yield prisma.user.create({
        data: {
            username,
            password,
        },
    });
    res.status(200);
}));
app.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    // verify and login user
    const targetUser = yield prisma.user.findFirst({
        where: {
            username,
        },
    });
    if (!targetUser) {
        res.status(400).send("Target user doesn't exists");
        return;
    }
    if (targetUser.password !== password) {
        res.status(400).send('Bad password');
        return;
    }
    //create and send JWT
    const token = generateAccessToken({ username });
    res.status(200).send(token);
}));
app.listen(3000, () => {
    console.log('listening on 3000');
});
