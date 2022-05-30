const express = require('express');


//validator
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { setTokenCookie, restoreUser, requireAuth } = require('../../utils/auth');

const { Spot, Image, Review, Booking, User } = require('../../db/models');
const spot = require('../../db/models/spot');
const router = express.Router();

const { Op } = require("sequelize");





// SPOT VALIDATION ERROR
//checks the body of new spot post request
const validateSpot = [
    check('address')
        .exists({ checkFalsy: true })
        // .notEmpty()
        .withMessage("Street address is required"),
    check('city')
        .exists({ checkFalsy: true })
        .withMessage("City is required"),
    check('state')
        .exists({ checkFalsy: true })
        .withMessage("State is required"),
    check('country')
        .exists({ checkFalsy: true })
        .withMessage("Country is required"),
    check('lat')
        .exists({ checkFalsy: true })
        .withMessage("Latitude is not valid"),
    check('lng')
        .exists({ checkFalsy: true })
        .withMessage("Longitude is not valid"),
    check('name')
        .exists({ checkFalsy: true })
        .withMessage("Name must be less than 50 characters"),
    check('description')
        .exists({ checkFalsy: true })
        .withMessage("Description is required"),
    check('price')
        .exists({ checkFalsy: true })
        .withMessage("Price per day is required"),
    handleValidationErrors
];

const validateReview = [
    check('review')
        .exists({ checkFalsy: true })
        .withMessage("Review text is required"),
    check('stars')
        .exists({ checkFalsy: true })
        .withMessage("Stars must be an integer from 1 to 5"),
    handleValidationErrors
];

// const validateBooking = [
//     check('startDate')
//         .exists({ checkFalsy: false })
//         .withMessage("Start date conflicts with an existing booking"),
//     check('endDate')
//         .exists({ checkFalsy: false })
//         .withMessage("End date conflicts with an existing booking"
//         ),
//     handleValidationErrors
// ];


//HELPER FUNCTION
const previewImage = (Spots) => {
    Spots.forEach(spot => {
        // console.log(spot)
        spot.dataValues.previewImage = spot.dataValues.Images.map(image => {
            return image.url
        }); // .map within to return new image.url

        //delete wihtin array
        delete spot.dataValues.Images;

    })
    return Spots;
}

//ROUTES
// GET ALL REVIEWS BY SPOT ID
router.get('/:spotId/reviews', async (req, res) => {
    const { spotId } = req.params;
    const reviewCount = await Review.count();

    const Reviews = await Review.findAll({
        where: {
            spotId
        },
        include: [{
            model: Image, as: 'images',
            attributes: ['url']
        },
        {
            model: User,
            attributes: { exclude: ['isHost', 'email', 'password', 'createdAt', 'updatedAt'] }
        }]
    });
    console.log(Reviews.length)
    if (Reviews.length > 0) {
        res.status(200);
        return res.json({ Reviews });
    } else {
        res.status(404);
        return res.json({
            "message": "Spot couldn't be found",
            "statusCode": 404
        });
    }
});

// CREATE A REVIEW FOR A SPOT BASED ON THE SPOTS ID
router.post('/:spotId/reviews', requireAuth, validateReview, async (req, res, next) => {
    const { spotId } = req.params;
    const { review, stars } = req.body;
    const reviewCount = await Review.count();
    const spotCount = await Spot.count();
    const spot = await Spot.findByPk(spotId)

    const alreadyReviewedByUser = await Review.findOne({
        where: {
            spotId,
            userId: req.user.id
        }
    });


    if (spot) {
        if (alreadyReviewedByUser) {
            res.status(403);
            const err = new Error("User already has a review for this spot");
            err.message = "User already has a review for this spot";
            err.status = 403;
            next(err);
        } else {
            const newReview = await Review.create({
                id: reviewCount + 1,
                userId: req.user.id,
                spotId,
                review,
                stars
            });
            res.status(200);
            res.json(newReview)
        }
    } else {
        res.status(404)
        const err = new Error("Spot couldn't be found");
        err.message = "Spot couldn't be found";
        err.status = 404;
        next(err);
    }


    // if (spotReviews.userId !== req.user.id) {
    //     const newReview = await Review.create({
    //         id: reviewCount + 1,
    //         userId: req.user.id,
    //         spotId,
    //         review,
    //         stars
    //     });
    // } else {
    //     res.status(403);
    //     const err = new Error("User already has a review for this spot");
    //     err.message = "User already has a review for this spot";
    //     err.status = 403;
    //     next(err);
    // }

    // const resReview = await Review.findByPk(reviewCount + 1);

    // if (spotId <= spotCount) {
    //     res.status(200);
    //     res.json(resReview);
    // } else {
    //     res.status(404)
    //     const err = new Error("Spot couldn't be found");
    //     err.message = "Spot couldn't be found";
    //     err.status = 404;
    //     next(err);
    // }
});

// GET ALL BOOKINGS FROM SPOT BASED ON SPOT ID
router.get('/:spotId/bookings', requireAuth, async (req, res) => {
    const { spotId } = req.params;
    const spot = await Spot.findByPk(spotId);
    const spotCount = await Spot.count();

    if (spot && (spot <= spotCount)) {
        if (req.user.id !== spot.ownerId) {
            res.status(200);
            const Bookings = await Booking.findOne({
                where: {
                    spotId: spot.id
                },
                attributes:
                    ['spotId', 'startDate', 'endDate']
            });
            res.json({ Bookings })
        } else {
            res.status(200);
            const Bookings = await Booking.findOne({
                include: [{
                    model: User,
                    attributes: ['id', 'firstName', 'lastName']
                }],
                where: {
                    spotId: spot.id
                }
            });
            res.json({ Bookings })
        }
    } else {
        res.status(404);
        res.json({
            "message": "Spot couldn't be found",
            "statusCode": 404
        })
    }
})

// CREATE A BOOKING FROM A SPOT BASED ON THE SPOT'S ID
router.post('/:spotId/bookings', requireAuth, async (req, res) => {
    const { spotId } = req.params;
    const spot = await Spot.findByPk(spotId);
    const spotCount = await Spot.count();
    const bookingCount = await Booking.count();
    const { id, userId, startDate, endDate } = req.body;

    const isClearBooking = await Booking.findAll({
        where: {
            //[Op.lte]: startDate
            //[Op.gte]: endDate
            [Op.or]: [
                {
                    startDate: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                {
                    endDate: {
                        [Op.between]: [startDate, endDate]
                    }
                },
            ]
        }
    });

    if (isClearBooking) {
        res.status(403);
        res.json({
            "message": "Sorry, this spot is already booked for the specified dates",
            "statusCode": 403,
            "errors": {
                "startDate": "Start date conflicts with an existing booking",
                "endDate": "End date conflicts with an existing booking"
            }
        });
    } else {
        if (spot && (spot <= spotCount)) {
            res.status(404)
            res.json({
                "message": "Spot couldn't be found",
                "statusCode": 404
            })
        } else {
            if (req.user.id !== spot.id) {
                const booking = await Booking.create({
                    id: bookingCount + 1,
                    spotId,
                    userId,
                    startDate,
                    endDate
                })
                res.status(200);
                res.json(booking);
            } else {
                const err = new Error('Forbidden');
                err.message = 'Forbidden';
                err.status = 403;
                return next(err);
            }
        }
    }

});

// GET IMAGES OF SPOT BY SPOTID
router.get('/:spotId/images', requireAuth, async (req, res) => {
    const { url } = req.body;
    const { spotId } = req.params;

    const spot = await Spot.findOne({
        where: {
            id: spotId
        },
        include: [{
            model: Image,
            as: 'Image'
        }]
    });


    res.status(200);
    res.json({ Image: spot.Image });

})

// ADD IMAGE TO SPOT BASED ON SPOTID
router.post('/:spotId/images', requireAuth, async (req, res) => {
    const { url } = req.body;
    const { spotId } = req.params;
    const spot = await Spot.findByPk(spotId);
    const imageCount = await Image.count();

    if (spot) {
        if (req.user.id === spot.ownerId) {
            if (spot) {
                const image = await Image.create({
                    id: imageCount + 1,
                    imageableType: 'Spot',
                    url,
                    spotId,
                    reviewId: null
                });

                if (image.spotId) {
                    image.dataValues.imageableId = spotId;
                    delete image.dataValues.spotId;
                    delete image.dataValues.reviewId;
                    delete image.dataValues.createdAt;
                    delete image.dataValues.updatedAt;
                }

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
            "message": "Spot couldn't be found",
            "statusCode": 404
        })
    }
});


// GET ALL SPOTS OF CURRENT USER
router.get('/me', requireAuth, async (req, res) => {
    const Spots = await Spot.findAll({
        include: [{
            model: Image,
            attributes: ['url']
        }],
        where: {
            ownerId: req.user.id
        }
    });
    // Spots.dataValues.previewImage =
    const newSpots = previewImage(Spots)


    res.status(200);
    return res.json({ Spots: newSpots });
});

// GET SPOT BY ID
router.get('/:spotId', async (req, res) => {
    const { spotId } = req.params;
    const spotCount = await Spot.count();
    const spots = await Spot.findOne({
        where: {
            id: spotId
        },
        include: [{
            model: Image,
            attributes: ['url']
        }]
    });
    console.log(spots, spotCount)
    console.log(1)
    if (spots && (spots.id <= spotCount)) {
        console.log(2)
        const reviews = await Review.count({
            where: {
                spotId
            }
        });
        const stars = await Review.findAll({
            where: {
                spotId
            },
            attributes: ['stars']
        })
        const owner = await User.findOne({
            where: {
                id: spots.ownerId
            },
            attributes: { exclude: ['isHost'] }
        })

        let starSum = 0;

        stars.forEach(star => {
            starSum += star.stars;
        })
        let rating = starSum / reviews;

        spots.dataValues.images = spots.dataValues.Images;
        delete spots.dataValues.Images;
        spots.dataValues.numReviews = reviews
        spots.dataValues.avgStarRatings = rating
        spots.dataValues.Owner = owner

        res.status(200);
        return res.json(spots);
    } else {
        res.status(404);
        return res.json({
            message: "Spot couldn't be found",
            statusCode: 404
        })
    }
});

// EDIT A SPOT
router.put('/:spotId', requireAuth, validateSpot, async (req, res, next) => {
    const { spotId } = req.params;
    const { address, city, state, country, lat, lng, name, description, price } = req.body;

    const spot = await Spot.findByPk(spotId);

    if (spot) {
        if (req.user.id === spot.ownerId) {
            spot.address = address;
            spot.city = city;
            spot.state = state;
            spot.country = country;
            spot.lat = lat;
            spot.lng = lng;
            spot.name = name;
            spot.description = description;
            spot.price = price;

            await spot.save();
            res.status(200);
            return res.json(spot);
        } else {
            const err = new Error('Forbidden');
            err.message = 'Forbidden';
            err.status = 403;
            return next(err);
        }
    } else {
        res.status(404);
        return res.json({
            "message": "Spot couldn't be found",
            "statusCode": 404
        })
    }
});

// DELETE SPOT BY ID
router.delete('/:spotId', requireAuth, async (req, res) => {
    const { spotId } = req.params;
    const spot = await Spot.findByPk(spotId);

    if (spot) {
        if (spot.ownerId === req.user.id) {
            await spot.destroy();

            res.status(200);
            res.json({
                "message": "Successfully deleted",
                "statusCode": 200
            });
        } else {
            const err = new Error('Forbidden');
            err.message = 'Forbidden';
            err.status = 403;
            return next(err);
        }
    } else {
        res.status(404);
        res.json({
            "message": "Spot couldn't be found",
            "statusCode": 404
        });
    }

})
const validatePagination = [
    check('page')
        .exists({ checkFalsy: true })
        .optional()
        .withMessage("Page must be greater than or equal to 0"),
    check('size')
        .exists({ checkFalsy: true })
        .optional()
        .withMessage("Size must be greater than or equal to 0"),
    handleValidationErrors
];
const validateLat = [
    check('minLat')
        .exists({ checkFalsy: true })
        .optional()
        .isDecimal()
        .withMessage("Maximum latitude is invalid"),
    check('maxLat')
        .exists({ checkFalsy: true })
        .optional()
        .isDecimal()
        .withMessage("Minimum latitude is invalid"),
    handleValidationErrors
];
const validateLng = [
    check('minLng')
        .exists({ checkFalsy: true })
        .optional()
        .isDecimal()
        .withMessage("Maximum longitude is invalid"),
    check('maxLng')
        .exists({ checkFalsy: true })
        .optional()
        .isDecimal()
        .withMessage("Minimum longitude is invalid"),
    handleValidationErrors
];

const validatePrice = [
    check('minPrice')
        .exists({ checkFalsy: true })
        .optional()
        .isDecimal()
        .withMessage("Maximum price must be greater than 0"),
    check('maxPrice')
        .exists({ checkFalsy: true })
        .optional()
        .isDecimal()
        .withMessage("Minimum price must be greater than 0"),
    handleValidationErrors
];


// GET ALL SPOTS
router.get('/', validatePagination, validateLat, validateLng, async (req, res) => {
    let { page, size, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;

    // PAGINATION
    if (page < 0 || page > 10 || !page) {
        page = 0;
    }
    if (size < 0 || size > 20 || !size) {
        size = 20;
    }

    let pag = {};
    let limit = parseInt(size);
    let offset = parseInt(size) * (parseInt(page) - 1);

    pag.limit = limit;
    if (offset >= 0) {
        pag.offset = offset;
    }

    // SEARCH QUERY
    const where = {}
    //LATTITUDE
    if (minLat) {
        where.lat = {
            [Op.gte]: minLat
        }
    }

    if (maxLat) {
        where.lat = {
            [Op.lte]: maxLat
        }
    }
    // LONGITUDE
    if (minLng) {
        where.lng = {
            [Op.gte]: minLng
        }
    }

    if (maxLng) {
        where.lng = {
            [Op.lte]: maxLng
        }
    }

    // PRICE
    if (minPrice) {
        where.price = {
            [Op.gte]: minPrice
        }
    }

    if (maxPrice) {
        where.price = {
            [Op.lte]: maxPrice
        }
    }

    const Spots = await Spot.findAll({

        where: { ...where },
        ...pag,
        include: [{
            model: Image,
            attributes: ['url']

        }]
    });

    const newSpots = previewImage(Spots)

    res.status(200);
    return res.json({ Spots: newSpots });
})



// CREATE A SPOT
router.post('/', requireAuth, validateSpot, async (req, res) => {
    const { address, city, state, country, lat, lng, name, description, price } = req.body;

    const spotCount = await Spot.count();
    const spot = await Spot.create({
        id: (spotCount + 1),
        ownerId: req.user.id,
        address,
        city,
        state,
        country,
        lat,
        lng,
        name,
        description,
        price
    });

    res.status(201);
    res.json(spot);
})



module.exports = router;
