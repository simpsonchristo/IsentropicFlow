'''
@venv: <venv>
@author: <Name>
@version: 1.0.0
@title: Isentropic Flow Module
'''

import numpy as np
import matplotlib.pyplot as plt


#def isentropicFlow(val, type, gamma):
class IsentropicFlow:
    #ToDo add conical shock relations
    def __init__(self, gamma=1.4, solverType='ifr'):
        if not isinstance(gamma, (int, float)):
            raise TypeError('Inappropriate type {} for gamma: a float or int is expected'.format(type(gamma)))
        self.gamma = float(gamma)
        if gamma <=1.0:
            raise ValueError('gamma must be greater than 1.0')
        self.solverType = solverType

    #ToDo delete if statements and replace with a function for each solver...
    #could also replace as a subclass inheriting the overall isentropic flow class
    def ifr(self, val, selectedItem):
        #ToDo put in the selected item and calculate the mach number
        pass

    # Temperature Ratio: T/To = Temperature / Total Temperature
    def tt0(self,m):
        return np.pow((1.+(self.gamma-1)/2.*m*m),-1)

    # Pressure Ratio: P/Po = Pressure / Total Pressure
    def pp0(self,m):
        return np.pow((1.+(self.gamma-1.)/2.*m*m),-self.gamma/(self.gamma-1.))

    # Density Ratio: rho/rho_o
    def rr0(self,m):
        return np.pow((1.+(self.gamma-1.)/2*m*m),-1/(self.gamma-1.))

    # Normal Shock
    def tts(self,m):
        return self.tt0(m)*(self.gamma/2. + 0.5)

    # Normal Shock
    def pps(self,m):
        return self.pp0(m)*np.pow((self.gamma/2 +0.5),self.gamma/(self.gamma-1.))

    # Normal Shock
    def rrs(self,m):
        return self.rr0(m)*np.pow((self.gamma/2 +0.5),1./(self.gamma-1.))

    # Normal Shock
    def aas(self,m):
        return 1./self.rrs(m)*np.sqrt(1./self.tts(m))/m

    # Prandtl Meyer Function
    def nu(self,m):
        n = np.sqrt((self.gamma + 1.) / (self.gamma - 1.)) * np.atan(np.sqrt((self.gamma - 1.) / (self.gamma + 1.) * (m * m - 1.)))
        n = n - np.atan(np.sqrt(m * m - 1.))
        n = n * 180. / 3.14159265359
        return n

    # Normal Shock
    def m2(self,m1):
        return np.sqrt((1. + .5 * (self.gamma - 1.) * m1 * m1) / (self.gamma * m1 * m1 - .5 * (self.gamma - 1.)))

    def __call__(self):
        pass
        # if (self.solverType=='ifr'):
        #     #input values, mach no, T/T0, p/p0, rho/rho0, A/A*(sub), A/A*(super), Mach angle, P-M angle
        #     def ifr(val, item):
        #         if item
        #
        # elif self.solverType=='osr':
        #     #input values, M1 + {turn angle (weak), turn angle (strong), wave angle, M1n}
        #
        # elif self.solverType=='nsr':
        #     #input values, M1, M2, p2/p1, rho2/rho1, T2/T1, p02/p01, p1/p02
        #
        # elif self.solverType=='fanf':
        #     #input values, mach no, T/T*, P/P*, P0/P0* (sub or sup), U/U*, 4fL*/D (sup or sub), (s*-s)/R (sup or sub)
        #
        # elif self.solverType=='rayf':
        #     #input values, mach no, T0/T0* (sup or sup), T/T*(above or below Tmax), P/P*, P0/P0*(sup or sub), U/U*, (s*-s)/R (sup or sub)


if __name__ == "__main__":

    def unittestrange(text, value, truthlow, truthhigh):
        if truthlow <= value <= truthhigh:
            print(f' {text} Passed')
        else:
            print(f' {text} Failed     Value {value}   Truth {truthlow} to {truthhigh}')
    def unittestvec(text,value,truth, tolerance):
        truthlow = [i*(1-tolerance) for i in truth]
        truthhigh = [i * (1 + tolerance) for i in truth]
        valuevec = [i  for i in value]
        unittestrange(text,valuevec,truthlow,truthhigh)
    def unittestscalar(text,value,truth, tolerance):
        truthlow = truth * (1 - tolerance)
        truthhigh =  truth * (1 + tolerance)
        unittestrange(text, value, truthlow, truthhigh)

    print(f'Unit tests of Isentropic Flow')
    flow = IsentropicFlow()
    # Reference Isentropic Flow Values from Gas Dynamics, James John, Table A.1
    unittestscalar("T/To Mach 0.5", flow.tt0(0.5), 0.9524, 0.001)
    unittestscalar("T/To Mach 1",flow.tt0(1),0.83333, 0.001)
    unittestscalar("T/To Mach 2", flow.tt0(2), 0.5555, 0.001)
    unittestscalar("P/Po Mach 0.5", flow.pp0(0.5), 0.8430, 0.001)
    unittestscalar("P/Po Mach 1", flow.pp0(1), 0.5283, 0.001)
    unittestscalar("P/Po Mach 2", flow.pp0(2), 0.1278, 0.001)
    unittestscalar("Density M 0.5", flow.rr0(0.5), 0.8851, 0.001)
    unittestscalar("Density M 1", flow.rr0(1), 0.6340, 0.001)
    unittestscalar("Density M 2", flow.rr0(2), 0.2300, 0.001)

    # Reference P-M Values from Gas Dynamics, James John, Appendix D
    unittestscalar("nu Mach 1", flow.nu(1), 0, 0.001)
    unittestscalar("nu Mach 2", flow.nu(2), 26.380, 0.001)

    # Normal Shock, Gamma 1.4, Gas Dynamics, James John, Appendix B
    unittestscalar("Normal Shock Mach gamma=1.4 M=1", flow.m2(1), 1.0, 0.0001)
    unittestscalar("Normal Shock Mach gamma=1.4 M=2", flow.m2(2), 0.5774, 0.0001)
    unittestscalar("Normal Shock Mach gamma=1.4 M=3", flow.m2(3), 0.4752, 0.0001)
    unittestscalar("Normal Shock Mach gamma=1.4 M=5", flow.m2(5), 0.4152, 0.0001)

    unittestscalar("Normal Shock Temp gamma=1.4 M=1", flow.tts(1), 1.0, 0.0001)
    unittestscalar("Normal Shock Temp gamma=1.4 M=2", flow.tts(2), 1.688, 0.0001)

    unittestscalar("Normal Shock Pressure gamma=1.4 M=1", flow.pps(1), 1.0, 0.0001)
    unittestscalar("Normal Shock Pressure gamma=1.4 M=2", flow.pps(2), 4.500, 0.0001)

    unittestscalar("Normal Shock Density gamma=1.4 M=1", flow.rrs(1), 1.0, 0.0001)
    unittestscalar("Normal Shock Density gamma=1.4 M=2", flow.rrs(2), 4.500, 0.0001)

    unittestscalar("Normal Shock Sonic Speed gamma=1.4 M=1", flow.aas(1), 1.0, 0.0001)
    unittestscalar("Normal Shock Sonic Speed gamma=1.4 M=2", flow.aas(2), 4.500, 0.0001)

