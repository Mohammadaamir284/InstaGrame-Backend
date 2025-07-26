const express = require('express');
const cookieParser = require('cookie-parser')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const port = process.env.PORT || 8000
const app = express()

app.use(cors({
    origin: process.env.FRONT_PORT,
    credentials: true
}));

require('./db/connection')
const User = require('./models/userschema')
const Image = require('./models/imageSchema')
const Contact = require('./models/contactSchema')
const authPost = require('./middelware/index')


app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.get('/', (req, res) => {
    res.send('Hello world')
})

app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, pic } = req.body;
        const isExist = await User.findOne({ $or: [{ username }, { email }] });
        if (isExist) {
            res.status(400).send('Username or Email Already Exist')
        } const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            email,
            pic,
            password: hashedPassword
        });
        await user.save();
        const JWT_SECRET = process.env.JWT_SECRET || 'WEFYUGWEFUWEFWEGYFWEFYWGEFIYWEF'
        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '1d' }
        )
        res.status(201).json({
            message: 'User successfully registered',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                pic: user.pic
            }
        });

    } catch (error) {
        res.status(500).send('/api/register', error)
    }
})

app.post('/api/login', async (req, res) => {
    try {
        const { email, password, pic } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).send('Email Or Password Is Invalid')
        } else {
            const dcrypt = await bcrypt.compare(password, user.password)
            if (!dcrypt) {
                res.status(400).send('Email Or Password Is Invalid')
            } else {
                const paylord = {
                    id: user._id,
                    username: user.username
                }
                const JWT_SECRET = process.env.JWT_SECRET || 'WEFYUGWEFUWEFWEGYFWEFYWGEFIYWEF'
                jwt.sign(
                    paylord,
                    JWT_SECRET,
                    { expiresIn: 86400 },
                    (err, token) => {
                        if (err) res.json({ message: err })
                        res.status(201).send({ user, token });
                    }
                )
            }
        }
    } catch (err) {
        res.status(500).send('Something went wrong'); // ✅ ये सही तरीका है
    }
})

app.post('/api/post', authPost, async (req, res) => {
    try {
        const { image, mediaType, } = req.body;
        // const { user } = req.header;
        const post = new Image({
            image,
            mediaType,
            user: req.user._id
        });
        await post.save();
        res.status(200).send('Create Post Succesfully')

    } catch (error) {
        res.status(500).send('Something went wrong');
    }
})

app.get('/api/post', authPost, async (req, res) => {
    try {
        const { user } = req;
        const posts = await Image.find({ user: user._id }).sort({ createdAt: -1 });
        res.status(200).json({ posts, user });
    } catch (error) {
        res.status(500).send('Something went wrong');
    }
})

app.get('/api/post/:username', authPost, async (req, res) => {
    try {
        const { username } = req.params;
        const { user: adminFollow } = req;
        const [user] = await User.find({ username });
        const posts = await Image.find({ user: user._id }).sort({ '_id': -1 });
        const [isFollow] = await Contact.find({ adminFollow: adminFollow._id, userFollowed: user._id })
        const userDetail = {
            user: user._id,
            username: user.username,
            email: user.email,
            pic: user.pic
        };
        res.status(200).json({ posts, userDetail, isFollow: !!isFollow });
    } catch (error) {
        res.status(500).send('Something went wrong');
    }
});

app.get('/api/allpost', authPost, async (req, res) => {
    try {
        const { user } = req;
        const posts = await Image.find().populate('user', '_id username email pic').sort({ '_id': -1 });
        res.status(200).json({ posts, user });
    } catch (error) {
        res.status(500).send('Something went wrong');
    }
})

app.post('/api/follow', authPost, async (req, res) => {
    try {
        const { id } = req.body;
        const { user } = req;
        if (!id) return res.status(400).send('ID not Found')
        const [followuser] = await User.find({ _id: id })
        const follow = new Contact({
            adminFollow: user,
            userFollowed: followuser,
        })
        await follow.save()
        res.status(200).json({ isFollow: true })
    } catch (error) {
        res.status(500).send('Something went wrong');
    }
})

app.get('/api/following/:id', authPost, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).send('User ID is required');
        const adminfollow = await Contact.find({ adminFollow: id }).populate('userFollowed', 'username email pic');
        const userfollowed = await Contact.find({ userFollowed: id }).populate('adminFollow', 'username email pic');
        res.status(200).json({ adminfollow, userfollowed});
    } catch (error) {
        res.status(500).send('Something went wrong');
    }
});

app.delete('/api/unfollow', authPost, async (req, res) => {
    try {
        const { id } = req.body;
        const { user } = req;
        if (!id) return res.status(400).send('ID not Found')
        await Contact.deleteOne({ adminFollow: user._id, userFollowed: id })
        res.status(200).json({ isFollow: false })
    } catch (error) {
        res.status(500).send('Something went wrong');
    }
})

app.put('/api/likes', authPost, async (req, res) => {
    try {
        const { id } = req.body;
        const { user } = req;
        if (!id) return res.status(400).send('ID not Found')
        const update = await Image.updateOne({ _id: id }, {
            $push: { likes: user._id }
        })
        if (update.modifiedCount === 0) {
            return res.status(400).send('Like not added');
        }
        res.status(200).json({ isLikes: true })

    } catch (error) {
        res.status(500).send('Something went wrong');
    }
})

app.delete('/api/unlikes', authPost, async (req, res) => {
    try {
        const { id } = req.body;
        const { user } = req;
        if (!id) return res.status(400).send('ID not Found')
        const update = await Image.updateOne({ _id: id }, {
            $pull: { likes: user._id }
        })       
         res.status(200).json({ isLikes: false })
    } catch (error) {
        res.status(500).send('Something went wrong');
    }
})

app.listen(port, () => {
    console.log('Server is gone')
})