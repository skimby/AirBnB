import { useSelector } from "react-redux";
import './SpotGallery.css';
import { useEffect, useState } from "react";
import ButtonSlider from "./ButtonSlider";

const SpotGallery = () => {
    const spots = Object.values(useSelector(state => state.spot))
    delete spots[10];

    //remove this later!!
    delete spots[0];
    delete spots[1];
    delete spots[2];

    const [slideIndex, setSlideIndex] = useState(1);

    // const allSlides = document.getElementsByClassName('slide');

    // const nextSlide = () => {
    //     console.log('next slide')
    //     if (slideIndex !== allSlides.length) {
    //         setSlideIndex(slideIndex + 1);
    //     } else if (slideIndex === allSlides.length) {
    //         setSlideIndex(1);
    //     }
    // }
    // const prevSlide = () => {
    //     console.log('prev slide')
    //     if (slideIndex !== allSlides.length) {
    //         setSlideIndex(slideIndex + 1);
    //     } else if (slideIndex === allSlides.length) {
    //         setSlideIndex(1);
    //     }

    // }


    return (
        <>
            <div className='spot-carousel'>

                {spots?.map((spot, index) => {
                    return (
                        <>
                            <div className={`eachSpot ${index}`} key={index}>

                                {spot.previewImage.map((image, i) => {
                                    return (
                                        <div
                                            className={slideIndex === i + 1 ? `slide active ${index}` : `slide ${index}`} key={i + `div ${i}`} >
                                            <img src={image} key={i} width='300px' className='image-styling' />
                                        </div>
                                    )
                                })}
                                <ButtonSlider className={index} slideIndex={slideIndex} setSlideIndex={setSlideIndex} direction={'next'} spotIndex={index} />

                                <ButtonSlider className={index} slideIndex={slideIndex} setSlideIndex={setSlideIndex} direction={'prev'} spots={spots} />
                            </div>
                        </>
                    )
                })}

                {/* <div className="dots">
                    {Array.from({ length: 5 }).map((item, i) => {
                        < div className={slideIndex === index + 1 ? 'dot active' : 'dot'}></div>
                    }}
                </div> */}

            </div>
        </>
    )
}

export default SpotGallery;
