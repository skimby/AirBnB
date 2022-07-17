import { useState } from "react";

import FullGallery from "../GalleryModal.js/FullGallery";
import { Modal } from "../../context/Modal";

import './GetSpot.css';
import './SpotGallery.css'

const SpotGallery = ({ spot }) => {
    const [showModal, setShowModal] = useState(false);


    return (

        <>
            {spot?.images && (

                <>
                    <div className='spot-gallery-main'>
                        <div className='img-0'>
                            <img src={spot?.images[0]?.url} width='100%' alt={spot?.images[0]?.name} className='img-0-class' />
                        </div>

                        <div className="spot-gallery-2">
                            <div className="img-1">
                                <img src={spot?.images[1]?.url} width='100%' alt={spot?.images[1]?.name} className='img-1-class' />
                            </div>
                            <div className="img-2">
                                <img src={spot?.images[2]?.url} width='100%' alt={spot?.images[2]?.name} className='img-2-class' />
                            </div>
                            <div className="img-3">
                                <img src={spot?.images[3]?.url} width='100%' alt={spot?.images[3]?.name} className='img-3-class' />
                            </div>
                            <div className="img-4">
                                <img src={spot?.images[4]?.url} width='100%' alt={spot?.images[4]?.name} className='img-4-class' />
                            </div>
                        </div>
                    </div>
                    <div className='show-all-button'>
                        <button onClick={() => setShowModal(true)}>
                            <i className="fa-solid fa-grid"></i>
                            Show all Photos</button>

                        {showModal && (
                            <Modal onClose={() => setShowModal(false)}>
                                <FullGallery spot={spot} />
                            </Modal>
                        )}
                    </div>
                </>
            )}
        </>
    )
}
export default SpotGallery;
