import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Route, Switch } from "react-router-dom";
import * as sessionActions from "./store/session";

import Navigation from './components/Navigation';
import SpotForm from "./components/SpotForm";
import GetSpot from "./components/GetSpot";
import CreateReview from "./components/GetSpot/CreateReview";
import AddImagesForm from "./components/AddImagesForm";
import AddReviewImagesForm from "./components/AddReviewImagesForm";
import Carousel from "./components/Carousel";

function App() {
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);


  useEffect(() => {
    //use .then to make sure restoreUser runs first
    dispatch(sessionActions.restoreUser()).then(() => setIsLoaded(true));

  }, [dispatch]);

  return (
    <>
      {/* Nav should always render */}
      <Navigation isLoaded={isLoaded} />

      {/* Home page should render after restoreUser is run */}
      {isLoaded && (
        <Switch>
          <Route path='/' exact >
            <Carousel />
          </Route>

          <Route path='/spots/:spotId' >
            <GetSpot />
          </Route>

          <Route path='/createSpot' >
            <SpotForm />
          </Route>

          <Route path='/editSpot/:spotId' >
            <SpotForm />
          </Route>

          <Route path='/addImages/:spotId' exact >
            <AddImagesForm />
          </Route>

          <Route path='/addImages/spots/:spotId/reviews/:reviewId' exact>
            <AddReviewImagesForm />
          </Route>

          <Route path='/createReview/:spotId' >
            <CreateReview />
          </Route>

        </Switch>
      )}

    </>
  )
}

export default App;
