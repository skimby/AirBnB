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
        console.log(spot)
        spot.dataValues.previewImage = spot.dataValues.Images.map(image => {
            return image.url
        }); // .map within to return new image.url

        //delete wihtin array
        delete spot.dataValues.Images;
        // return;

    })
}

//ROUTES
// GET ALL REVIEWS BY SPOT ID
router.get('/:spotId/reviews', async (req, res) => {
    const { spotId } = req.params;
    const reviewCount = await Review.count();

    const reviews = await Review.findAll({
        where: {
            spotId
        },
        include: {
            model: Image,
            attributes: ['url']
        }
    });

    if (reviews >= reviewCount) {
        res.status(200);
        res.json(reviews);
    } else {
        res.status(404);
        res.json({
            "message": "Spot couldn't be found",
            "statusCode": 404
        });
    }
});

// CREATE NEW REVIEW FOR SPOT BY SPOTID
router.post('/:spotId/reviews', requireAuth, validateReview, async (req, res) => {
    const { spotId } = req.params;
    const { review, stars } = req.body;
    const reviewCount = await Review.count();
    const spotCount = await Spot.count();

    const spotReviews = await Review.findOne({
        where: {
            spotId
        }
    });

    if (spotReviews.userId !== req.user.id) {
        const newReview = await Review.create({
            id: reviewCount + 1,
            userId: req.user.id,
            spotId,
            review,
            stars
        });
    } else {
        res.status(403);
        res.json({
            "message": "User already has a review for this spot",
            "statusCode": 403
        })
    }

    const resReview = await Review.findByPk(reviewCount + 1);

    if (spotId <= spotCount) {
        res.status(200);
        res.json(resReview);
    } else {
        res.status(404);
        res.json({
            "message": "Spot couldn't be found",
            "statusCode": 404
        });
    }
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
            };
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
router.get('/me', restoreUser, async (req, res) => {
    const Spots = await Spot.findAll({
        include: [{
            model: Image, as: 'previewImage',
            attributes: ['url']
        }],
        where: {
            ownerId: req.user.id
        }
    });

    res.status(200);
    res.json({ Spots })
});

// GET SPOT BY ID
router.get('/:spotId', async (req, res) => {
    const { spotId } = req.params;

    const spots = await Spot.findByPk(spotId);

    if (spots) {
        res.status(200);
        res.json(spots);
    } else {
        res.status(404);
        res.json({
            message: "Spot couldn't be found",
            statusCode: 404
        })
    }
});

// EDIT A SPOT BY ID
router.put('/:spotId', restoreUser, validateSpot, async (req, res) => {
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
            res.json(spot);
        }
    } else {
        res.status(404);
        res.json({
            "message": "Spot couldn't be found",
            "statusCode": 404
        })
    }
});

// DELETE SPOT BY ID
router.delete('/:spotId', restoreUser, async (req, res) => {
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

    // const images = await Image.findAll({
    //     where: {
    //         spotId
    //     }
    // })
    // PAGINATION
    if (page < 0 || page > 10 || !page) {
        page = 0;
    }
    if (size < 0 || size > 20 || !size) {
        size = 20;
    }

    let limit = parseInt(size);
    let offset = parseInt(size) * (parseInt(page) - 1);

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
        limit,
        offset,
        where: { ...where },

        include: [{
            model: Image,
            attributes: ['url']

        }]
    });

    previewImage(Spots)

    res.status(200);
    return res.json({ Spots });
})



// CREATE A NEW SPOT
router.post('/', restoreUser, validateSpot, async (req, res) => {
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
    const newSpot = await Spot.findOne({
        where: {
            id: spotCount + 1
        }
    })
    res.status(201);
    res.json(newSpot);
})



module.exports = router;
