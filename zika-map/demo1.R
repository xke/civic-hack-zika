
library(googleVis)


data <- read.csv2("C:/Dev/sfstate/zikadataset.csv",header = T,sep = ,stringsAsFactors = T)
Geo=gvisGeoChart(data, locationvar="country", 
                 colorvar="cases",
                 options=list(projection="kavrayskiy-vii"))
plot(Geo)

#-----------

if (!require(devtools))
  install.packages("devtools")
devtools::install_github("rstudio/leaflet")
shiny::runGitHub("C:/Dev/sfstate/", subdir="063-superzip-example")
