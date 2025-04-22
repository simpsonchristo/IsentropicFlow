'''
@venv: <venv>
@author: <Name>
@version: 1.0.0
@title: Combustor
'''

import numpy as np
import matplotlib.pyplot as plt
from models.IsentropicFlow import IsentropicFlow

#class vehicle:
#    def __init__(self, inlet_mach_number, inlet_temperature, inlet_pressure, fuel_air_ratio, combustion_efficiency):
#       self.inlet_mach_number = inlet_mach_number
#        self.inlet_temperature = inlet_temperature
#        self.inlet_pressure = inlet_pressure
#        self.fuel_air_ratio = fuel_air_ratio
#        self.combustion_efficiency = combustion_efficiency

flow = IsentropicFlow()
#example 3.13 from [Anderson, Modern Compressible Flow..., 3rd ed.]
p1 = 1      #atm
T1 = 273    #K
M1 = 0.2
q = 1.0E+6  #J/kg
gamma = 1.4
Rair = 287  #J/kg-K
#calculate state 2
cp = gamma*Rair/(gamma-1)
#calculate static/total temp ratio for M1
TT0 = flow.tt0(M1)
PP0 = flow.pp0(M1)
T01 = T1/TT0
p01 = p1/PP0
#determine total stagnation temp from heat addition
T02 = q/cp + T01
t02t01 = T02/T01
t02tsr = t02t01*flow.t0t0sr(0.2)