import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import { PrismaClient} from '@prisma/client';
import jwt from 'jsonwebtoken';


const prisma = new PrismaClient();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const dotenv = require('dotenv');
// get config vars
dotenv.config();

// access config var
process.env.TOKEN_SECRET;

app.get('/', async (req, res) => {
    const count = await prisma.convertations.count();

    res.json({ count: count });
});

function generateAccessToken(username: Record<string, string>) {
    return jwt.sign(username, process.env.TOKEN_SECRET as string, {
        expiresIn: '1800s',
    });
}

// middle_ware
// 
function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);
    
    try {
        const { username } = jwt.verify(
            token,
            process.env.TOKEN_SECRET as string
        ) as { username: string };
        req['username'] = username;
        next();
    } catch (error) {
        res.status(403).send('теряйся наху');
        return;
    }
}

/* the main functionality */
app.post('/', authenticateToken, async (req, res) => {
    // authenticate user
    const result = await prisma.convertations.count({
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
    } else {
        res.status(400).send('пшол наху, лимит зеро. ёпт');
    }
});

/* registr new user */
app.post('/reg', async (req, res) => {
    const { username, password } = req.body;
    
    const getUser = await prisma.user.findFirst({
        where: { username },
    });

    if (getUser) {
        res.status(400).send('This username already used');
        return;
    }

    // add user to db
    const post = await prisma.user.create({
        data: {
            username,
            password,
        },
    });

    res.status(200);
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // verify and login user
    const targetUser = await prisma.user.findFirst({
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
});

app.listen(3000, () => {
    console.log('listening on 3000');
});
