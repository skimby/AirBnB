import { useState } from "react";
import SpotForm from "./SpotForm";
import { Modal } from '../../context/Modal.js';

const SpotFormModal = ({ editForm, newSpot }) => {
    const [showModal, setShowModal] = useState(false);
    const [isNewForm, setIsNewForm] = useState()

    return (
        <>
            {newSpot && (
                <button onClick={() => {
                    setIsNewForm(true)
                    setShowModal(true)
                }}>Become a Host</button>

            )}

            {editForm && (
                <button onClick={() => {
                    setIsNewForm(false)
                    setShowModal(true)
                }}>Edit Spot</button>

            )}

            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <SpotForm showModal={showModal} setShowModal={setShowModal} isNewForm={isNewForm} />
                </Modal>
            )}
        </>
    );
}

export default SpotFormModal;
