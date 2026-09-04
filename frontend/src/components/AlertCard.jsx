import React from "react";
import { Alert, AlertTitle, Button } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export default function AlertCard({ title, description, buttonText, onButtonClick }) {
  return (
    <Alert 
      severity="warning" 
      sx={{ mb: 3, borderRadius: 2 }}
      action={
        buttonText && (
          <Button 
            color="inherit" 
            size="small" 
            endIcon={<ArrowForwardIcon />}
            onClick={onButtonClick}
          >
            {buttonText}
          </Button>
        )
      }
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      {description}
    </Alert>
  );
}
