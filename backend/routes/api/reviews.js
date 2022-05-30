const express = require('express');

//validator
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { setTokenCookie, restoreUser, requireAuth } = require('../../utils/auth');

const { Spot, Image, User, Review } = require('../../db/models');
const router = express.Router();

const validateReview = [
    check('review')
        .exists({ checkFalsy: true })
        .withMessage("Review text is required"),
    check('stars')
        .exists({ checkFalsy: true })
        .withMessage("Stars must be an integer from 1 to 5"),
    handleValidationErrors
];

// ADD IMAGE TO REVIEW BASED ON REVIEWID
router.post('/:reviewId/images', requireAuth, async (req, res) => {
    const { url } = req.body;
    const { reviewId } = req.params;
    const review = await Review.findByPk(reviewId);
    const imageCount = await Image.count();
    const allReviewImagesCount = await Image.count({
        where: {
            reviewId
        },
        attributes: {
            url
        }
    })

    if (review) {
        if (req.user.id === review.userId) {
            if (allReviewImagesCount >= 10) {
                res.status(400);
                res.json({
                    "message": "Maximum number of images for this resource was reached",
                    "statusCode": 400
                })
            } else {
                const image = await Image.create({
                    id: imageCount + 1,
                    imageableType: 'Review',
                    url,
                    spotId: null,
                    reviewId
                });

                image.dataValues.imageableId = reviewId;
                delete image.dataValues.spotId;
                delete image.dataValues.reviewId;
                delete image.dataValues.createdAt;
                delete image.dataValues.updatedAt;

                res.status(200);
                res.json(image);
            }
        } else {
            const err = new Error('Forbidden');
            err.message = 'Forbidden';
            err.status = 403;
            return next(err);
        }
    } else {
        res.status(404);
        res.json({
            "message": "Review couldn't be found",
            "statusCode": 404
        })
    }

});
// GET REVIEWS OF CURRENT USER
router.get('/me', requireAuth, async (req, res) => {
    const Reviews = await Review.findAll({
        where: {
            userId: req.user.id
        },
        include: [
            {
                model: Spot,
                attributes: { exclude: ['createdAt', 'updatedAt', 'description'] }
            },
            {
                model: Image,
                as: 'images',
                attributes: ['url']
            },
            {
                model: User,
                attributes: { exclude: ['isHost', 'email', 'password', 'createdAt', 'updatedAt'] }
            }]
    });

    res.status(200);
    return res.json({ Reviews });
});


// GET REVIEW BY ID
router.get('/:reviewId', async (req, res) => {
    const { reviewId } = req.params;
    const review = await Review.findByPk(reviewId);
    res.status(200);
    res.json(review);

})

// EDIT REVIEW
router.put('/:reviewId', requireAuth, validateReview, async (req, res, next) => {
    const { reviewId } = req.params;
    const { review, stars } = req.body;
    const editReview = await Review.findByPk(reviewId);

    console.log(editReview)


    if (editReview) {
        if (editReview.userId === req.user.id) {
            editReview.review = review;
            editReview.start = stars;
            await editReview.save();
            res.status(200);
            return res.json(editReview);
        } else {
            const err = new Error('Forbidden');
            err.message = 'Forbidden';
            err.status = 403;
            return next(err);
        }

    } else {
        res.status(404);
        const err = new Error("Review couldn't be found");
        err.message = "Review couldn't be found";
        err.status = 404;
        return next(err);
    }
});

// DELETE REVIEW
router.delete('/:reviewId', requireAuth, async (req, res, next) => {
    const { reviewId } = req.params;

    const review = await Review.findByPk(reviewId);

    if (review) {
        if (review.userId === req.user.id) {
            await review.destroy();
            res.status(200);
            const err = new Error("Successfully deleted");
            err.message = "Successfully deleted";
            err.status = 200;
            return next(err);

        } else {
            const err = new Error('Forbidden');
            err.message = 'Forbidden';
            err.status = 403;
            return next(err);
        }

    } else {
        res.status(404);
        const err = new Error("Review couldn't be found");
        err.message = "Review couldn't be found";
        err.status = 404;
        return next(err);

    }

})



module.exports = router;
