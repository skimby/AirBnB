import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";

import Gallery from "./Gallery";
import ButtonSlider from "./ButtonSlider";
import Dots from "./Dots";
import './SpotGallery.css'


const GalleryCard = ({ spot, index }) => {
    const history = useHistory();

    const [slideIndex, setSlideIndex] = useState(1);
    const [needsDefaultImg, setNeedsDefaultImg] = useState();


    const handleClick = () => {
        if (spot) {
            history.push(`/spots/${spot.id}`)
        }
    }
    useEffect(() => {
        if (spot?.previewImage?.length === 0) {
            setNeedsDefaultImg(true);
        } else {
            setNeedsDefaultImg(false);
        }
    }, [spot])

    return (
        <>
            <div className="gallery-card" >

                {spot && !needsDefaultImg && (
                    <>
                        <Gallery spot={spot} index={index} slideIndex={slideIndex} setSlideIndex={setSlideIndex} onClick={handleClick} />

                        <div className='container-dots'>
                            <Dots slideIndex={slideIndex} spot={spot} />
                        </div>

                        <div className='button-div'>
                            <ButtonSlider className={index} direction={'prev'} spotIndex={index} key={`${index} prev button`} spot={spot} slideIndex={slideIndex} setSlideIndex={setSlideIndex} />

                            <ButtonSlider className={index} direction={'next'} spotIndex={index} key={`${index} next button`} spot={spot} slideIndex={slideIndex} setSlideIndex={setSlideIndex} />
                        </div>

                        <div className="spots-body" key={spot?.id} onClick={handleClick}>

                            <div className='spot-card-header' key={spot?.id + 'card'}>
                                <h3 key={spot?.id + 'location'}>
                                    {`${spot?.city}, ${spot?.state}`}</h3>
                                <h5 key={spot?.id + 'price'}>
                                    ${spot?.price} night</h5>
                                <div className="spot-name-div">
                                    <h5 key={spot?.id + 'name'}>
                                        {spot?.name} </h5>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {needsDefaultImg && (
                    <>
                        <Gallery spot={spot} index={index} slideIndex={slideIndex} setSlideIndex={setSlideIndex} onClick={handleClick} />

                        <div className='container-dots hide'>
                            <Dots slideIndex={slideIndex} spot={spot} />
                        </div>
                        <div className='button-div hide'>
                            <ButtonSlider className={index} direction={'prev'} spotIndex={index} key={`${index} prev button`} spot={spot} slideIndex={slideIndex} setSlideIndex={setSlideIndex} />

                            <ButtonSlider className={index} direction={'next'} spotIndex={index} key={`${index} next button`} spot={spot} slideIndex={slideIndex} setSlideIndex={setSlideIndex} />
                        </div>

                        <div className="spots-body" key={spot?.id} onClick={handleClick}>

                            <div className='spot-card-header' key={spot?.id + 'card'}>
                                <h3 key={spot?.id + 'location'}>
                                    {`${spot?.city}, ${spot?.state}`}</h3>
                                <h5 key={spot?.id + 'price'}>
                                    ${spot?.price} night</h5>

                                <div className="spot-name-div">
                                    <h5 key={spot?.id + 'name'}>
                                        {spot?.name} </h5>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}


export default GalleryCard;
