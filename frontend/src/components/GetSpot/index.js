import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useHistory } from "react-router-dom";

import { deleteOneSpot, getOneSpot } from "../../store/spot";
import { getSpotReviews } from "../../store/review";
import { getUsersBookings } from "../../store/booking";
import SpotFormModal from "../SpotFormModal";
import Reviews from "./Reviews";
import SpotGallery from "./SpotGallery";
import './GetSpot.css'



const GetSpot = () => {
    const dispatch = useDispatch();
    const history = useHistory();
    let { spotId } = useParams();
    spotId = parseInt(spotId);

    const [userOwned, setUserOwned] = useState();
    const [bookedUser, setBookedUser] = useState(false);
    const [hasNoImages, setHasNoImages] = useState();
    const [editForm, setEditForm] = useState(true);

    const user = useSelector(state => state.session.user);
    const spot = useSelector(state => state.spot.currentSpot);
    const reviews = Object.values(useSelector(state => state.review));
    const userBookings = Object.values(useSelector(state => state.booking));

    useEffect(() => {
        dispatch(getOneSpot(spotId))
        // .catch(async (res) => {
        //     const data = await res.json()
        //     console.log(data)
        //     console.log(data.errors)
        // });
        dispatch(getSpotReviews(spotId))
    }, [dispatch, spotId]);

    useEffect(() => {
        dispatch(getUsersBookings(user?.id));
    }, [dispatch, user]);

    useEffect(() => {
        if (spot) {
            if (user?.id === spot?.ownerId) {
                setUserOwned(true)
            } else {
                setUserOwned(false);
            }
        }
    }, [user, spot]);

    useEffect(() => {
        if (spot && userBookings) {
            const hasBooked = userBookings?.find(booking => spotId === booking.spotId);
            const hasReviewed = reviews?.find(review => user.id === review.userId);

            if (hasBooked && !hasReviewed) {
                setBookedUser(true);
            } else {
                setBookedUser(false);
            }
        }
    }, [spot, spotId, userBookings, reviews, user])

    useEffect(() => {
        if (spot?.images?.length === 0) {
            setHasNoImages(true);
        } else {
            setHasNoImages(false);
        }
    }, [spot])

    // const handleClick = () => {
    //     history.push(`/editSpot/${spotId}`)
    // }

    const handleReviewClick = () => {
        if (spot) {
            history.push(`/spots/${spotId}/reviews`)
        }
    }

    const handleAddImage = () => {
        history.push(`/addImages/${spotId}`)
    }

    const handleDelete = async () => {
        await dispatch(deleteOneSpot(spotId));
        history.push(`/`)
    }

    return (
        <>
            {spot && (
                <div className="spot-container">
                    <>
                        <h2>{spot?.name}</h2>
                        <div className="review-header">
                            <i className="fa-solid fa-star fa-sm spots-star"></i>
                            <h4>{spot?.avgStarRatings?.toFixed(1)} · {spot?.numReviews} reviews  · {spot?.city}, {spot?.state}</h4>
                        </div>

                        {hasNoImages && (
                            <div className='default-img'>
                                <img src='https://airbnb-images-bucket.s3.us-east-2.amazonaws.com/placeholder-image.png' width='100%' alt='placeholder' className='default' />
                            </div>
                        )}
                        {!hasNoImages && (
                            <SpotGallery spot={spot} />
                        )}


                        <div className="reviews-container">
                            <i className="fa-solid fa-star fa-sm"></i>
                            <h2>{spot?.avgStarRatings?.toFixed(1)} · {spot?.numReviews} Reviews</h2>

                            {bookedUser && (
                                <div className='write-review'>
                                    <h3>You've stayed here recently. Write a review of your visit!</h3>
                                    <button onClick={handleReviewClick}>Write Review</button>
                                </div>
                            )}

                            {reviews && reviews?.map((review, index) => {
                                return (
                                    <div className='each-review' key={index}>
                                        <Reviews spot={spot} review={review} />

                                    </div>
                                )
                            })}


                            <h2>{reviews?.id}</h2>
                        </div>


                    </>

                    {userOwned && (
                        <>
                            <SpotFormModal editForm={editForm} />
                            {/* <button onClick={handleClick}>Edit Spot</button> */}
                            <button onClick={handleAddImage}>Add Images</button>

                            <button onClick={handleDelete}>Delete Spot</button>
                        </>
                    )}

                </div>
            )}
        </>
    )
}

export default GetSpot;
