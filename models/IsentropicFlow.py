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

    def tt0(self,m):
        return np.pow((1.+(self.gamma-1)/2.*m*m),-1)

    def pp0(self,m):
        return np.pow((1.+(self.gamma-1.)/2.*m*m),-self.gamma/(self.gamma-1.))

    def rr0(self,m):
        return np.pow((1.+(self.gamma-1.)/2*m*m),-1/(self.gamma-1.))

    def tts(self,m):
        return self.tt0(self,m)*(self.gamma/2. + 0.5)

    def pps(self,m):
        return self.pp0(self,m)*np.pow((self.gamma/2 +0.5),self.gamma/(self.gamma-1.))

    def rrs(self,m):
        return self.rr0(self,m)*np.pow((self.gamma/2 +0.5),1./(self.gamma-1.))

    def aas(self,m):
        return 1./self.rrs(self,m)*np.sqrt(1./self.tts(self,m))/m

    def nu(self,m):
        n = np.sqrt((self.gamma + 1.) / (self.gamma - 1.)) * np.atan(np.sqrt((self.gamma - 1.) / (self.gamma + 1.) * (m * m - 1.)))
        n = n - np.atan(np.sqrt(m * m - 1.))
        n = n * 180. / 3.14159265359
        return n

    def m2(self,m1):
        return np.sqrt((1. + .5 * (self.gamma - 1.) * m1 * m1) / (self.gamma * m1 * m1 - .5 * (self.gamma - 1.)))

    def __call__(self):

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

